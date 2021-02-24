const express = require('express')
const fs = require('fs')
const path = require('path')

const app = express()

app.use(express.static('public'))

//the most recent release of the app
const latestRelease = '1.2.0'

app.get('/', (request, response) => {
  response.sendFile(__dirname + '/views/index.html')
})

//set up a route that listens for GET requests on a specific platform with an optional version passed in
app.get('/releases/:platform', (request, response) => {
  const { platform } = request.params //pull the OS platform from the URL parameters
  const { currentVersion } = request.query //pull the current version from a query parameter

  //check if the current version equals the latest version referenced earlier
  if (currentVersion === latestRelease) {
    //if it matches, returns an HTTP 204 status code
    response.status(204)
    return response.end()
  }

  //if the platform is macOS, returns a payload with the URL to the newest bundle for macOS
  if (platform === 'darwin') {
    return response.json({
      url:
        'https://cdn.glitch.com/f52e5387-d62f-4b75-a3ae-3fb841c88f36%2FFire%20Sale-darwin-x64-v1.2.0.zip?1509384546668',
    })
  }

  //if the platform is Windows, returns a payload with the URL to the newest bundle for Windows
  if (platform === 'win32') {
    return response.json({
      url:
        'https://cdn.glitch.com/f52e5387-d62f-4b75-a3ae-3fb841c88f36%2FFire%20Sale-darwin-x64-v1.2.0.zip?1509384546668',
    })
  }

  //if the platform is Linux, returns a payload with the URL to the newest bundle for Linux
  if (platform === 'linux') {
    return response.json({
      url:
        'https://cdn.glitch.com/f52e5387-d62f-4b75-a3ae-3fb841c88f36%2FFire%20Sale-darwin-x64-v1.2.0.zip?1509384546668',
    })
  }

  response.status(404).end()
})

const listener = app.listen(process.env.PORT, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
