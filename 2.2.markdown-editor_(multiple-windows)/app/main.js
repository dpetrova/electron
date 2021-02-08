const { app, BrowserWindow, dialog } = require('electron')
const fs = require('fs')

//create a Set to keep track of new windows
const windows = new Set()
//create a Map to watch currently opened files
const openFiles = new Map()

//create a window when the application is ready
app.on('ready', () => {
  createWindow()
})

//quit when all windows are closed, except on macOS (there, it's common for applications and their menu bar to stay active until the user quits explicitly with Cmd + Q)
app.on('window-all-closed', function () {
  //checks to see if the application is running on macOS
  if (process.platform === 'darwin') {
    //if it is, returns false to prevent the default action
    return false
  }
  //if it isn’t, quits the application
  app.quit()
})

//on macOS it's common to re-create a window when the application is open and when the dock icon is clicked but there are no other windows open
app.on('activate', (event, hasVisibleWindows) => {
  if (!hasVisibleWindows) {
    createWindow()
  }
})

//responding to external requests to open a file with the application (e.g. open file from recent documents)
app.on('will-finish-launching', () => {
  app.on('open-file', (event, file) => {
    event.preventDefault()
    const win = createWindow()
    win.once('ready-to-show', () => {
      openFile(win, file)
    })
  })
})

//create new window
const createWindow = () => {
  let x, y

  //get the browser window that is currently active
  const currentWindow = BrowserWindow.getFocusedWindow()

  //sets the coordinates of the next window down and right to the currently active window
  if (currentWindow) {
    const [currentWindowX, currentWindowY] = currentWindow.getPosition()
    x = currentWindowX + 10
    y = currentWindowY + 10
  }

  let newWindow = new BrowserWindow({
    //if x and y are defined -> create new window at the x- and y-coordinates; if x and y are udefined -> new window is created in the default position
    x,
    y,
    show: false, //hide the window when it’s first created to prevent blank window
    webPreferences: {
      nodeIntegration: true, //enable Node integration (e.g. to have require) because the default nodeIntegration=false
      contextIsolation: false, //for security purposes enable this which ensures that both your preload scripts and Electron's internal logic run in a separate context to the website you load in a webContents
      enableRemoteModule: true, //to can use remote.require in renderer process
    },
  })

  //implement isEdited property to can track if currently open file is edited
  newWindow.isCurrentlyEdited = false

  newWindow.loadFile('app/index.html')
  //newWindow.webContents.loadURL(`file://${__dirname}/index.html`) //url must contain the protocol prefix, e.g. the http:// or file://

  newWindow.once('ready-to-show', () => {
    newWindow.show()
  })

  //closed event is fired when the window has successfully been closed
  newWindow.on('closed', () => {
    //remove the reference from the windows set when it has been closed
    windows.delete(newWindow)
    //when the window is closed, stops the watcher for the file associated with that window
    stopWatchingFile(newWindow)
    newWindow = null
  })

  //close event is fired when the user attempts to close the window
  newWindow.on('close', (event) => {
    //check if the document has been edited (we set this in the renderer process on every keyup in the Markdown view by comparing the current content with the original content)
    if (newWindow.isDocumentEdited() || newWindow.isCurrentlyEdited) {
      //if the window has unsaved changes, prevents it from closing
      event.preventDefault()

      //prompt the user with a custom message box about unsaved changes; save their selection into “result”
      const result = dialog.showMessageBoxSync(newWindow, {
        type: 'warning',
        title: 'Quit with Unsaved Changes?',
        message: 'Your changes will be lost permanently if you do not save.',
        buttons: ['Quit Anyway', 'Cancel'], //provides a list of button labels
        defaultId: 0, //set the first button as the default option if the user hits the Return key
        cancelId: 1, //set the second button as the button selected if the user dismisses the message box
      })

      //showMessageBox() returns the index of the button that the user selected -> if the user selects “Quit Anyway”, forces the window to close
      if (result === 0) newWindow.destroy()
    }
  })

  //add the window to the windows set when it has been opened
  windows.add(newWindow)
  return newWindow
}

//open file dialog to get file as takes a reference to a browser window object to determine which window should display the file dialog and subsequently load the file selected by the user
const getFileFromUser = (targetWindow) => {
  const files = dialog.showOpenDialogSync(targetWindow, {
    //openFile flag signifies that this dialog box is for selecting a file to open
    properties: ['openFile'],
    //whitelisting specific file types
    filters: [
      { name: 'Text Files', extensions: ['txt'] },
      { name: 'Markdown Files', extensions: ['md', 'markdown'] },
    ],
  })

  if (files) {
    const file = files[0]
    //takes a reference to a browser window object to determine which window should receive the contents of the file
    openFile(targetWindow, file)
  }
}

//send file content from the main to renderer process
const openFile = (targetWindow, file) => {
  //read from the file, and converts the resulting buffer to a string
  const content = fs.readFileSync(file).toString()
  //append file to operating system’s list of recently opened documents
  app.addRecentDocument(file)
  //set the represented file in macOS
  targetWindow.setRepresentedFilename(file)
  //send the name of the file and its content to the specific window in the renderer process over the “file-opened” channel
  targetWindow.webContents.send('file-opened', file, content)
  //start watching that file for changes be another application
  startWatchingFile(targetWindow, file)
}

//export the generated html output
const saveHtml = (targetWindow, content) => {
  const file = dialog.showSaveDialogSync(targetWindow, {
    title: 'Save HTML',
    defaultPath: app.getPath('documents'), //defaults to the user’s “documents” directory as defined by the operating system
    filters: [{ name: 'HTML Files', extensions: ['html', 'htm'] }],
  })

  //if the user selects cancel in the File dialog box, aborts the function
  if (!file) return

  fs.writeFileSync(file, content)
}

//saving the current markdown file
const saveMarkdown = (targetWindow, file, content) => {
  //if this is a new file without a file path, prompts the user to select a file path with a dialog box
  if (!file) {
    file = dialog.showSaveDialogSync(targetWindow, {
      title: 'Save Markdown',
      defaultPath: app.getPath('documents'),
      filters: [{ name: 'Markdown Files', extensions: ['md', 'markdown'] }],
    })
  }

  //if the user selects Cancel in the File dialog box, aborts the function
  if (!file) return

  //write the contents of the buffer to the filesystem
  fs.writeFileSync(file, content)
  openFile(targetWindow, file)
}

//start watching a file path when it’s opened
const startWatchingFile = (targetWindow, file) => {
  //close the existing watcher if there is one
  stopWatchingFile(targetWindow)

  //fire file-changed if external app change currently opened file
  const watcher = fs.watch(file, (eventType, filename) => {
    if (eventType === 'change') {
      const content = fs.readFileSync(file).toString()
      targetWindow.webContents.send('file-changed', file, content)
    }
  })

  //track the watcher so we can stop it later
  openFiles.set(targetWindow, watcher)
}

//stop watching a file when either the window has been closed or the user opens a different file in the window
const stopWatchingFile = (targetWindow) => {
  //check if we have a watcher running for this window
  if (openFiles.has(targetWindow)) {
    openFiles.get(targetWindow).close() //stop watcher
    openFiles.delete(targetWindow) //delete the watcher from the maps of open windows
  }
}

//еxport ability to open the file dialog from the renderer process
exports.getFileFromUser = getFileFromUser
//еxport ability to create new window from the renderer process
exports.createWindow = createWindow
exports.openFile = openFile
exports.saveHtml = saveHtml
exports.saveMarkdown = saveMarkdown
