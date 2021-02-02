const { app, BrowserWindow } = require('electron')

//create a variable in the top-level scope for the main window of our application
let mainWindow = null

//called as soon as the application has fully launched
app.on('ready', () => {
  console.log('Hello from Electron')
  //create a browser window, and assigns it to the variable created in the top-level scope
  mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true, //enable Node integration (e.g. to have require) because the default nodeIntegration=false
      contextIsolation: false, //for security purposes enable this which ensures that both your preload scripts and Electron's internal logic run in a separate context to the website you load in a webContents
    },
  })
  //tell the browser window to load an HTML file located in the same directory as the main process
  mainWindow.webContents.loadURL(`file://${__dirname}/index.html`)

  //open the DevTools (COMMENT IN PRODUCTION!!!!!!)
  //mainWindow.webContents.openDevTools()
})
