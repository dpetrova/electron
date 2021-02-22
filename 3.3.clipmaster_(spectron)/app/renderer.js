const { clipboard, ipcRenderer, shell } = require('electron')

//create axios instance as set default parameters for every HTTP request
const axios = require('axios').create({
  baseURL: 'https://api.github.com',
  headers: {
    Accept: 'application/vnd.github.v3+json',
    Authorization: 'token 253817f080eb36600ba5ca10b9a72139667448ce',
  },
})

//caching dom elements
const clippingsList = document.getElementById('clippings-list')
const copyFromClipboardButton = document.getElementById('copy-from-clipboard')

//set up IPC listeners in the renderer process
ipcRenderer.on('create-new-clipping', () => {
  console.log('attemt to create clipping')
  addClippingToList()
  new Notification('Clipping Added', {
    body: `${clipboard.readText()}`,
  })
})

ipcRenderer.on('write-to-clipboard', () => {
  const clipping = clippingsList.firstChild
  writeToClipboard(getClippingText(clipping))
  new Notification('Clipping Copied', {
    body: `${clipboard.readText()}`,
  })
})

ipcRenderer.on('publish-clipping', () => {
  const clipping = clippingsList.firstChild
  publishClipping(getClippingText(clipping))
})

//creating a DOM element for the clipping based on the clipping’s text
const createClippingElement = (clippingText) => {
  //create a new element for the clipping
  const clippingElement = document.createElement('article')
  //add the .clippings-list-item class to it so that it’s styled appropriately
  clippingElement.classList.add('clippings-list-item')
  //set the inner HTML of the new element
  clippingElement.innerHTML = `
    <div class="clipping-text" disabled="true"></div>
    <div class="clipping-controls">
      <button class="copy-clipping">&rarr; Clipboard</button>
      <button class="publish-clipping">Publish</button>
      <button class="remove-clipping">Remove</button>
    </div>
  `
  //find the node where the clipping text should go, and set its content to the text of the clipping
  clippingElement.querySelector('.clipping-text').innerText = clippingText

  //return the new element
  return clippingElement
}

//reading from clipboard and adding a clipping to list
const addClippingToList = () => {
  //use Electron’s clipboard module to read text from the clipboard
  const clippingText = clipboard.readText()
  //create a DOM node to display the clipping in the UI
  const clippingElement = createClippingElement(clippingText)
  //add it to the top of the list of clippings in the UI
  clippingsList.prepend(clippingElement)
}

//set up event listener for "Copy from Clipboard" button
copyFromClipboardButton.addEventListener('click', addClippingToList)

//set up an event listener to the list of clippings; click events from individual clippings bubble up the list
clippingsList.addEventListener('click', (event) => {
  //a helper function that determines whether the target element has a given class
  const hasClass = (className) => event.target.classList.contains(className)
  //get the entire containing DOM node
  const clippingListItem = getButtonParent(event)

  //determine what kind of button was clicked and take appropriate action
  if (hasClass('remove-clipping')) {
    removeClipping(clippingListItem)
  }
  if (hasClass('copy-clipping')) {
    writeToClipboard(getClippingText(clippingListItem))
  }
  if (hasClass('publish-clipping')) {
    publishClipping(getClippingText(clippingListItem))
  }
})

//navigate to the DOM node that contains the entire clipping
const getButtonParent = ({ target }) => {
  return target.parentNode.parentNode
}

//traversing the clipping and finding the text that was originally saved by the user
const getClippingText = (clippingListItem) => {
  return clippingListItem.querySelector('.clipping-text').innerText
}

//рemovе a clipping from the DOM
const removeClipping = (target) => {
  target.remove()
}

//write a clipping to the clipboard
const writeToClipboard = (clippingText) => {
  clipboard.writeText(clippingText)
}

const publishClipping = (clippingText) => {
  axios
    .post('/gists', {
      description: 'Created with Clipmaster 9000',
      public: 'true',
      files: {
        'clipping.txt': { content: clippingText },
      },
    })
    .then((response) => {
      //get url of the published clipping
      const gistUrl = response.data.html_url
      //display url to the user in native OS notification
      const notification = new Notification(
        'Your Clipping Has Been Published',
        { body: `Click to open ${gistUrl} in your browser.` }
      )
      //open newly publishing gist if user click on link
      notification.onclick = () => {
        shell.openExternal(gistUrl)
      }
      //write url to the clipboard
      clipboard.writeText(gistUrl)
    })
    .catch((error) => {
      return new Notification('Error Publishing Your Clipping', {
        body: error.message,
      })
    })
}
