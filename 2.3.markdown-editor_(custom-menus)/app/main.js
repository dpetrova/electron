const { app, BrowserWindow, dialog, Menu } = require('electron')
const fs = require('fs')

//to build custom menu
const applicationMenu = require('./application-menu')

const windows = new Set()
const openFiles = new Map()

//create a window when the application is ready
app.on('ready', () => {
  //set custom build menu
  Menu.setApplicationMenu(applicationMenu)
  createWindow()
})

//quit when all windows are closed exept when run on macOS
app.on('window-all-closed', function () {
  if (process.platform === 'darwin') {
    return false
  }
  app.quit()
})

//re-create a window when the app is open and when the dock icon is clicked but there are no other windows open on macOS
app.on('activate', (event, hasVisibleWindows) => {
  if (!hasVisibleWindows) {
    createWindow()
  }
})

//responding to external requests to open a file with the application
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

  const currentWindow = BrowserWindow.getFocusedWindow()

  if (currentWindow) {
    const [currentWindowX, currentWindowY] = currentWindow.getPosition()
    x = currentWindowX + 10
    y = currentWindowY + 10
  }

  let newWindow = new BrowserWindow({
    x,
    y,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  })

  newWindow.isCurrentlyEdited = false
  newWindow.loadFile('app/index.html')
  //newWindow.webContents.loadURL(`file://${__dirname}/index.html`)

  newWindow.once('ready-to-show', () => {
    newWindow.show()
  })

  //closed event is fired when the window has successfully been closed
  newWindow.on('closed', () => {
    windows.delete(newWindow)
    stopWatchingFile(newWindow)
    newWindow = null
  })

  //close event is fired when the user attempts to close the window
  newWindow.on('close', (event) => {
    if (newWindow.isDocumentEdited() || newWindow.isCurrentlyEdited) {
      event.preventDefault()

      //prompt the user with a custom message box about unsaved changes
      const result = dialog.showMessageBoxSync(newWindow, {
        type: 'warning',
        title: 'Quit with Unsaved Changes?',
        message: 'Your changes will be lost permanently if you do not save.',
        buttons: ['Quit Anyway', 'Cancel'], //provides a list of button labels
        defaultId: 0,
        cancelId: 1,
      })

      if (result === 0) newWindow.destroy()
    }
  })

  windows.add(newWindow)
  return newWindow
}

//open file dialog to get file
const getFileFromUser = (targetWindow) => {
  const files = dialog.showOpenDialogSync(targetWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Text Files', extensions: ['txt'] },
      { name: 'Markdown Files', extensions: ['md', 'markdown'] },
    ],
  })

  if (files) {
    const file = files[0]
    openFile(targetWindow, file)
  }
}

//send file content from the main to renderer process
const openFile = (targetWindow, file) => {
  const content = fs.readFileSync(file).toString()
  app.addRecentDocument(file)
  targetWindow.setRepresentedFilename(file) //set the represented file in macOS
  targetWindow.webContents.send('file-opened', file, content)
  startWatchingFile(targetWindow, file)
}

//export the generated html output
const saveHtml = (targetWindow, content) => {
  const file = dialog.showSaveDialogSync(targetWindow, {
    title: 'Save HTML',
    defaultPath: app.getPath('documents'), //defaults to the user’s “documents” directory as defined by the operating system
    filters: [{ name: 'HTML Files', extensions: ['html', 'htm'] }],
  })

  if (!file) return

  fs.writeFileSync(file, content)
}

//saving the current markdown file
const saveMarkdown = (targetWindow, file, content) => {
  if (!file) {
    file = dialog.showSaveDialogSync(targetWindow, {
      title: 'Save Markdown',
      defaultPath: app.getPath('documents'),
      filters: [{ name: 'Markdown Files', extensions: ['md', 'markdown'] }],
    })
  }

  if (!file) return

  fs.writeFileSync(file, content)
  openFile(targetWindow, file)
}

//start watching a file path when it’s opened
const startWatchingFile = (targetWindow, file) => {
  stopWatchingFile(targetWindow)

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

exports.getFileFromUser = getFileFromUser
exports.createWindow = createWindow
exports.openFile = openFile
exports.saveHtml = saveHtml
exports.saveMarkdown = saveMarkdown
