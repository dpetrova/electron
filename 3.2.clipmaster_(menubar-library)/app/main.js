const { menubar } = require('menubar')
const { globalShortcut, Menu } = require('electron')

//instead of requiring the app module from Electron, we create an instance of menubar
const mb = menubar({
  preloadWindow: true, //set the preloadWindow option to true to load the UI, even if it has never been requested
  index: `file://${__dirname}/index.html`, //specify the HTML document that should be preloaded
  browserWindow: {
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
    },
  },
})

//menubar fires its ready event when the app module fires its ready event
mb.on('ready', () => {
  console.log('Application is ready.')

  //create a secondary menu when the user rightclicks the icon
  const secondaryMenu = Menu.buildFromTemplate([
    {
      label: 'Quit',
      click() {
        mb.app.quit()
      },
      accelerator: 'CommandOrControl+Q',
    },
  ])

  mb.tray.on('right-click', () => {
    mb.tray.popUpContextMenu(secondaryMenu)
  })

  //set up global shortcuts with IPC
  const createClipping = globalShortcut.register('CommandOrControl+R', () => {
    mb.window.webContents.send('create-new-clipping')
  })

  const writeClipping = globalShortcut.register('CmdOrCtrl+Alt+W', () => {
    mb.window.webContents.send('write-to-clipboard')
  })

  const publishClipping = globalShortcut.register('CmdOrCtrl+Alt+P', () => {
    mb.window.webContents.send('publish-clipping')
  })

  const quitApp = globalShortcut.register('CommandOrControl+Q', () =>
    mb.app.quit()
  )

  if (!createClipping) {
    console.error('Registration failed', 'createClipping')
  }
  if (!writeClipping) {
    console.error('Registration failed', 'writeClipping')
  }
  if (!publishClipping) {
    console.error('Registration failed', 'publishClipping')
  }
  if (!quitApp) {
    console.error('Registration failed', 'quitApp')
  }
})
