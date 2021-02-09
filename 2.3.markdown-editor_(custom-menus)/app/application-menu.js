const { app, BrowserWindow, dialog, Menu, shell } = require('electron')
const mainProcess = require('./main')

const createApplicationMenu = () => {
  //a way to see if any windows are open is to use BrowserWindow.getAllWindows(); if no windows are open, this array will be empty
  const hasOneOrMoreWindows = !!BrowserWindow.getAllWindows().length
  //get the currently focused window (or null if there is no focused window)
  const focusedWindow = BrowserWindow.getFocusedWindow()
  //if there is a focused window, we use its getRepresentedFile() method to get a reference to the current file path
  const hasFilePath = !!(
    focusedWindow &&
    (focusedWindow.getRepresentedFilename() ||
      focusedWindow.currentlyRepresentedFilename)
  )

  /* Template array that will serve as the blueprint for the menu */
  const template = [
    //File menu
    {
      label: 'File',
      submenu: [
        {
          label: 'New File',
          accelerator: 'CommandOrControl+N',
          click() {
            //tell the main process to create a new window
            mainProcess.createWindow()
          },
        },
        {
          label: 'Open File',
          accelerator: 'CommandOrControl+O',
          //click methods can optionally take the menu item itself and the currently focused window as arguments
          click(item, focusedWindow) {
            //on macOS the application remains running even when all the windows have been closed (focusedWindow is undefined in that case), so we check if there is opened window
            if (focusedWindow) {
              //tell the main process to prompt the user to select a new file to open in the current window
              return mainProcess.getFileFromUser(focusedWindow)
            }

            //in there is no opened window -> create a new one and then open a file in it when the new window has been shown
            const newWindow = mainProcess.createWindow()
            newWindow.on('show', () => {
              mainProcess.getFileFromUser(newWindow)
            })
          },
        },
        {
          label: 'Save File',
          accelerator: 'CommandOrControl+S',
          enabled: hasOneOrMoreWindows,
          click(item, focusedWindow) {
            //on macOS the application remains running even when all the windows have been closed (focusedWindow is undefined in that case), so we check if there is opened window
            if (!focusedWindow) {
              //use dialog.showErrorBox() to display an alert, and returns from the function early
              return dialog.showErrorBox(
                'Cannot Save or Export',
                'There is currently no active document to save or export.'
              )
            }

            //send a message to the currently focused window to save its Markdown
            focusedWindow.webContents.send('save-markdown')
          },
        },
        {
          label: 'Export HTML',
          accelerator: 'Shift+CommandOrControl+S',
          enabled: hasOneOrMoreWindows,
          click(item, focusedWindow) {
            if (!focusedWindow) {
              return dialog.showErrorBox(
                'Cannot Save or Export',
                'There is currently no active document to save or export.'
              )
            }

            //send a message to the currently focused window to export its HTML
            focusedWindow.webContents.send('save-html')
          },
        },
        { type: 'separator' }, //define separators between menu items
        {
          label: 'Show File',
          enabled: hasFilePath,
          accelerator: 'Alt+CommandOrControl+O',
          click(item, focusedWindow) {
            //if there is no focused window, display an error to the user and return from the function
            if (!focusedWindow) {
              return dialog.showErrorBox(
                "Cannot Show File's Location",
                'There is currently no active document show.'
              )
            }
            //send a message over the show-file channel via IPC to the frontmost window
            focusedWindow.webContents.send('show-file')
          },
        },
        {
          label: 'Open in Default Application',
          enabled: hasFilePath,
          accelerator: 'Shift+CommandOrControl+O',
          click(item, focusedWindow) {
            if (!focusedWindow) {
              return dialog.showErrorBox(
                'Cannot Open File in Default Application',
                'There is currently no active document to open.'
              )
            }
            //send a message over the open-indefault channel via IPC to the frontmost window
            focusedWindow.webContents.send('open-in-default')
          },
        },
      ],
    },
    //Edit menu
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          accelerator: 'CommandOrControl+Z', //menu items can be given keyboard shortcuts called accelerators
          role: 'undo', //a role, which correlates to a built-in capability provided by the operating system
        },
        {
          label: 'Redo',
          accelerator: 'Shift+CommandOrControl+Z',
          role: 'redo',
        },
        { type: 'separator' },
        {
          label: 'Cut',
          accelerator: 'CommandOrControl+X',
          role: 'cut',
        },
        {
          label: 'Copy',
          accelerator: 'CommandOrControl+C',
          role: 'copy',
        },
        {
          label: 'Paste',
          accelerator: 'CommandOrControl+V',
          role: 'paste',
        },
        {
          label: 'Select All',
          accelerator: 'CommandOrControl+A',
          role: 'selectall',
        },
      ],
    },
    //Window menu
    {
      label: 'Window',
      submenu: [
        {
          label: 'Minimize',
          accelerator: 'CommandOrControl+M',
          role: 'minimize',
        },
        {
          label: 'Close',
          accelerator: 'CommandOrControl+W',
          role: 'close',
        },
      ],
    },
    //Help menu
    {
      label: 'Help',
      role: 'help',
      submenu: [
        {
          label: 'Visit Website',
          click() {
            /* To be implemented */
          },
        },
        {
          label: 'Toggle Developer Tools',
          click(item, focusedWindow) {
            if (focusedWindow) focusedWindow.webContents.toggleDevTools()
          },
        },
      ],
    },
  ]

  /* Build correct menu in macOS */
  //in macOS the first menu is always the Application menu, so to have correct menus we need to shift all menu items one place to the right
  if (process.platform === 'darwin') {
    const name = 'Firesale'
    //const name = app.getName();

    //use unshift() method to add one Menu item with some important macOS functionality to the beginning of an array
    template.unshift({
      label: name,
      submenu: [
        {
          label: `About ${name}`,
          role: 'about',
        },
        { type: 'separator' },
        {
          label: 'Services',
          role: 'services',
          submenu: [],
        },
        { type: 'separator' },
        {
          label: `Hide ${name}`,
          accelerator: 'Command+H',
          role: 'hide',
        },
        {
          label: 'Hide Others',
          accelerator: 'Command+Alt+H',
          role: 'hideothers',
        },
        {
          label: 'Show All',
          role: 'unhide',
        },
        { type: 'separator' },
        {
          label: `Quit ${name}`,
          accelerator: 'Command+Q',
          //there is no built-in role for quitting an application; instead, we add a click method that is called whenever the menu item is clicked or keyboard shortcut activated
          click() {
            app.quit()
          },
        },
      ],
    })

    const windowMenu = template.find((item) => item.label === 'Window')
    //this enables the display of a list of currently open windows
    windowMenu.role = 'window'
    //add additional menu item "Bring All to Front", which moves all of the windows of the application to the front of the stack
    windowMenu.submenu.push(
      { type: 'separator' },
      {
        label: 'Bring All to Front',
        role: 'front',
      }
    )
  }

  //build the menu from the template, and sets it as the application menu
  return Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

module.exports = createApplicationMenu
