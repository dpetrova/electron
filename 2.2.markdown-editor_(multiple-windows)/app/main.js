const { app, BrowserWindow, dialog } = require('electron')
const fs = require('fs')

//create a Set to keep track of new windows
const windows = new Set()

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

  newWindow.loadFile('app/index.html')
  //newWindow.webContents.loadURL(`file://${__dirname}/index.html`) //url must contain the protocol prefix, e.g. the http:// or file://

  //add the window to the windows set when it has been opened
  windows.add(newWindow)

  newWindow.once('ready-to-show', () => {
    newWindow.show()
  })

  newWindow.on('closed', () => {
    //remove the reference from the windows set when it has been closed
    windows.delete(newWindow)
    newWindow = null
  })

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
  //send the name of the file and its content to the specific window in the renderer process over the “file-opened” channel
  targetWindow.webContents.send('file-opened', file, content)
}

//еxport ability to open the file dialog from the renderer process
exports.getFileFromUser = getFileFromUser
//еxport ability to create new window from the renderer process
exports.createWindow = createWindow
