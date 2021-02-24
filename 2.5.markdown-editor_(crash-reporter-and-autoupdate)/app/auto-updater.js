const { app, autoUpdater, dialog, BrowserWindow } = require('electron')

//check if we’re running this Electron application in development
const isDevelopment = app.getPath('exe').indexOf('electron') !== -1

//store the base URL of the server where you host releases
const baseUrl = 'https://firesale-releases.glitch.me'

//get the current OS on which application is running
const platform = process.platform

//get the current version of the application
const currentVersion = app.getVersion()

//create the path from which to request an update, based on the OS and application version
const releaseFeed = `${baseUrl}/releases/${platform}?currentVersion=${currentVersion}`

if (isDevelopment) {
  //if the application is in development mode, does not check for an update
  console.info('[AutoUpdater]', 'In Developement Mode. Skipping…')
} else {
  //otherwise, set the feed of the autoUpdater to the URL you just created
  console.info('[AutoUpdater]', `Setting release feed to ${releaseFeed}.`)
  autoUpdater.setFeedURL(releaseFeed)
}

//if an update is available, perform the action provided
autoUpdater.addListener(
  'update-available',
  (event, releaseNotes, releaseName) => {
    console.log('UPDATED!', event, releaseNotes, releaseName)
    dialog.showMessageBox(
      {
        type: 'question',
        buttons: ['Install & Relaunch', 'Not Now'],
        defaultId: 0,
        message: `${app.getName()} has been updated!`,
        detail: 'An update has been downloaded and can be installed now.',
      },
      (response) => {
        if (response === 0) {
          setTimeout(() => {
            //remove the event listener for the windows-allclosed event
            app.removeAllListeners('window-all-closed')
            //close all of the windows
            BrowserWindow.getAllWindows().forEach((win) => win.close())
            //quit the application, and install the update
            autoUpdater.quitAndInstall()
          }, 0)
        }
      }
    )
  }
)

module.exports = autoUpdater
