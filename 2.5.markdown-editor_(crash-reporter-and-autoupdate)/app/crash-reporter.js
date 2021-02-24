const { crashReporter } = require('electron')
const manifest = require('../package.json')

const host = 'http://localhost:3000/' //URL where the crash reports are sent via an HTTP POST request

const axios = require('axios').create({
  baseURL: host,
  headers: {
    'Content-Type': 'application/json',
  },
})

const config = {
  productName: 'Fire Sale',
  companyName: 'Electron in Action',
  submitURL: host + 'crashreports',
  uploadToServer: true, //indicate that you want the crash results to be sent to the server
  compress: false,
}

//start the Crashpad or Breakpad crash reporter using the configuration options passed in
crashReporter.start(config)

//set up a function to report uncaught exceptions
const sendUncaughtException = (error) => {
  const { productName, companyName } = config
  console.info('Catching error', error)
  //send an HTTP POST request to the crash server
  axios.post('/uncaughtexceptions', {
    form: {
      _productName: productName,
      _companyName: companyName,
      _version: manifest.version,
      platform: process.platform,
      process_type: process.type,
      ver: process.versions.electron,
      error: {
        //send information about the error that was fired
        name: error.name,
        message: error.message,
        fileName: error.fileName,
        stack: error.stack,
        lineNumber: error.lineNumber,
        columnNumber: error.columnNumber,
      },
    },
  })
}

//check if we’re running in the main or renderer process
if (process.type === 'browser') {
  //if the error occurred in the main process, uses Node’s uncaughtException event
  process.on('uncaughtException', sendUncaughtException)
} else {
  //if the error occurred in the renderer process, adds an event listener to the global object
  window.addEventListener('error', sendUncaughtException)
}

console.log('[INFO] Crash reporting started.', crashReporter)

module.exports = crashReporter
