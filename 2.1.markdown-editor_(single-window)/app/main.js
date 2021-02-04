const { app, BrowserWindow, dialog } = require('electron')
const fs = require('fs')

//declares mainWindow at the top level so that it won’t be collected as garbage after the “ready” event completes
let mainWindow = null

app.on('ready', () => {
  //create a new BrowserWindow
  mainWindow = new BrowserWindow({
    show: false, //hide the window when it’s first created to prevent blank window
    webPreferences: {
      nodeIntegration: true, //enable Node integration (e.g. to have require) because the default nodeIntegration=false
      contextIsolation: false, //for security purposes enable this which ensures that both your preload scripts and Electron's internal logic run in a separate context to the website you load in a webContents
      enableRemoteModule: true, //to can use remote.require in renderer process
    },
  })

  //load app/index.html in the BrowserWindow instance
  mainWindow.loadFile('app/index.html')
  //mainWindow.webContents.loadURL(`file://${__dirname}/index.html`) //loads the url in the window, url must contain the protocol prefix, e.g. the http:// or file://

  //a single event listener to "ready-to-show" -> show the window when the DOM is ready
  mainWindow.once('ready-to-show', async () => {
    mainWindow.show()
    //mainWindow.webContents.openDevTools(); // programmatically trigger the opening of the Developer Tools
  })

  //set the process back to null when the window is closed
  mainWindow.on('closed', () => {
    mainWindow = null
  })
})

//open file dialog to get file
const getFileFromUser = () => {
  /* sync method */
  //trigger the operating system’s Open File dialog box; and pass a JS object of different configuration arguments
  const files = dialog.showOpenDialogSync(mainWindow, {
    properties: ['openFile'], //openFile flag signifies that this dialog box is for selecting a file to open (other flags available are "openDirectory" and "multiselections")
    //whitelisting specific file types (filters property allows us to specify what types of files our application should be able to open and disables any file that doesn’t match our criteria)
    filters: [
      { name: 'Text Files', extensions: ['txt'] },
      { name: 'Markdown Files', extensions: ['md', 'markdown'] },
    ],
  })

  if (files) {
    const file = files[0] //get first file in the array
    openFile(file)
  }

  /* async method */
  // dialog
  //   .showOpenDialog({
  //     properties: ['openFile'],
  //   })
  //   .then((result) => {
  //     console.log(result)
  //     const files = result.filePaths
  //   })
  //   .catch((err) => {
  //     console.log(err)
  //   })
}

//send content from the main to a renderer process
const openFile = (file) => {
  //read from the file, and converts the resulting buffer to a string
  const content = fs.readFileSync(file).toString()
  //send the name of the file and its content to the renderer process over the “file-opened” channel
  mainWindow.webContents.send('file-opened', file, content)
}

//еxport ability to open the file dialog from the renderer process
exports.getFileFromUser = getFileFromUser
