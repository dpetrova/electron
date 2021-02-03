const { app, BrowserWindow } = require('electron')

//declares mainWindow at the top level so that it won’t be collected as garbage after the “ready” event completes
let mainWindow = null

app.on('ready', () => {
  //create a new BrowserWindow
  mainWindow = new BrowserWindow({
    show: false, //hide the window when it’s first created to prevent blank window
    webPreferences: {
      nodeIntegration: true, //enable Node integration (e.g. to have require) because the default nodeIntegration=false
      contextIsolation: false, //for security purposes enable this which ensures that both your preload scripts and Electron's internal logic run in a separate context to the website you load in a webContents
    },
  })

  //load app/index.html in the BrowserWindow instance
  mainWindow.loadFile('app/index.html')

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
