const {
  app,
  BrowserWindow,
  clipboard,
  globalShortcut,
  Menu,
  Tray,
  nativeTheme,
} = require('electron')

const path = require('path')

//declare variables in the global scope
let tray = null //store a reference to the tray instance
const clippings = [] //an empty array to store clippings
let browserWindow = null //its purpose will be to show notifications

//conditionally choose icon based on the platform
const getIcon = () => {
  //set icon in window
  if (process.platform === 'win32') return 'icon-light@2x.ico'
  //detect if macOS is in dark mode
  if (nativeTheme.shouldUseDarkColors) return 'icon-light.png'
  return 'icon-dark.png'
}

app.on('ready', () => {
  //hide the dock icon if running on macOS
  if (app.dock) app.dock.hide()

  //create a tray instance by calling the constructor with a path to an image
  tray = new Tray(path.join(__dirname, getIcon()))
  //set an alternate icon when icon is pressed in macOS
  tray.setPressedImage(path.join(__dirname, 'icon-light.png'))

  //on Windows, we register a click event listener to open the menu
  if (process.platform === 'win32') {
    tray.on('click', () => tray.popUpContextMenu())
  }

  //launch hidden browser window which serve to show notifications
  browserWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  })
  browserWindow.loadURL(`file://${__dirname}/index.html`)

  //defining the accelerators (shortcuts) and an anonymous functions that should be invoked whenever the accelerator is pressed
  const activationShortcut = globalShortcut.register(
    'CommandOrControl+Alt+C',
    () => {
      tray.popUpContextMenu()
    }
  )

  const newClippingShortcut = globalShortcut.register(
    'CommandOrControl+Shift+Alt+C',
    () => {
      const clipping = addClipping()
      //if there was a clipping saved, we send a notification to the renderer process, which triggers the notification
      if (clipping) {
        browserWindow.webContents.send(
          'show-notification',
          'Clipping Added',
          clipping
        )
      }
    }
  )

  const quitShortcut = globalShortcut.register('CommandOrControl+Q', () =>
    app.quit()
  )

  //if shortcut registration fails, Electron does not throw an error, instead, it returns undefined
  if (!activationShortcut)
    console.error('Global activation shortcut failed to register')
  if (!newClippingShortcut)
    console.error('Global new clipping shortcut failed to register')
  if (!quitShortcut) console.error('Global quit shortcut failed to register')

  //updates the menu immediately when the application starts to build it for the first time
  updateMenu()

  //optionally, defines a tooltip to be shown when the user hovers over the tray icon
  tray.setToolTip('Clipmaster')
})

const updateMenu = () => {
  //build a context menu
  const menu = Menu.buildFromTemplate([
    {
      label: 'Create New Clipping',
      click() {
        addClipping()
      },
      accelerator: 'CommandOrControl+Shift+Alt+C', //add an accelerator; this is available when the menu is active
    },
    { type: 'separator' },
    //each time updateMenu() is called, we map through the array of clippings and render first 10 of them as simple menu items
    ...clippings.slice(0, 10).map(createClippingMenuItem),
    { type: 'separator' },
    {
      label: 'Quit',
      click() {
        app.quit()
      },
      accelerator: 'CommandOrControl+Q',
    },
  ])

  //set the context menu that appears when the user clicks the icon in the menu or system tray in macOS and Windows
  tray.setContextMenu(menu)
}

const addClipping = () => {
  //use Electron’s clipboard module to read text from the system clipboard
  const clipping = clipboard.readText()
  //add the text read from the clipboard into the array of clippings
  if (clippings.includes(clipping)) return
  clippings.unshift(clipping)
  //regenerate the menu to display the new clipping as a menu item
  updateMenu()

  return clipping
}

const createClippingMenuItem = (clipping, index) => {
  return {
    //truncate menu item labels if the length of the clipping is longer than 20 characters
    label: clipping.length > 20 ? clipping.slice(0, 20) + '…' : clipping,
    //when a user clicks on a given clipping, writes it to the clipboard
    click() {
      clipboard.writeText(clipping)
    },
    //assign the menu item an accelerator based on its index inside of the clippings array
    accelerator: `CommandOrControl+${index}`,
  }
}
