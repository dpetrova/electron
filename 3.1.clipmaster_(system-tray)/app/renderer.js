/* Listening for messages and displaying notifications */

const { ipcRenderer } = require('electron')

ipcRenderer.on(
  'show-notification',
  (event, title, body, onClick = () => {}) => {
    //Notifications are part of Chromium’s built-in APIs and are not specific to Electron; it takes two arguments: a string for the title, and an object of additional parameters
    const myNotification = new Notification(title, { body })
    myNotification.onclick = onClick
  }
)
