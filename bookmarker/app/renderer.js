//reference Electron’s shell module which provides some functions related to high-level desktop integration
const { shell } = require('electron')

//instantiate a DOMParser
const parser = new DOMParser()

// caching DOM element selectors
const linksSection = document.querySelector('.links')
const errorMessage = document.querySelector('.error-message')
const newLinkForm = document.querySelector('.new-link-form')
const newLinkUrl = document.querySelector('.new-link-url')
const newLinkSubmit = document.querySelector('.new-link-submit')
const clearStorageButton = document.querySelector('.clear-storage')

/* SETUP EVENT LISTENERS */

newLinkUrl.addEventListener('keyup', () => {
  //use Chromium’s ValidityState API to determine if the input is valid when a user types in the input field, and enable/disable submit btn
  newLinkSubmit.disabled = !newLinkUrl.validity.valid
})

newLinkForm.addEventListener('submit', (event) => {
  //tell Chromium not to trigger an HTTP request, the default action for form submissions
  event.preventDefault()
  //grab the value of the new link input field
  const url = newLinkUrl.value

  //using the Fetch API to request a remote resource
  fetch(url)
    .then(validateResponse)
    .then((response) => response.text()) //parse the response as plain text
    .then(parseResponse) //parse string into a DOM
    .then(findTitle) //get title of html
    .then((title) => storeLink(title, url)) //store in localStorage
    .then(clearForm) //clear out url input
    .then(renderLinks) //render currently stored links
    .catch((error) => handleError(error, url)) //if any promise in this chain rejects or throws an error, catches the error and displays it in the UI
})

clearStorageButton.addEventListener('click', () => {
  localStorage.clear() //empties all the links from localStorage
  linksSection.innerHTML = '' //remove the links from the UI
})

//opening links in the user’s default browser
linksSection.addEventListener('click', (event) => {
  //check if the element that was clicked was a link
  if (event.target.href) {
    //if it is a link, don’t open it normally
    event.preventDefault()
    //use Electron’s shell module to open a link in the user’s default browser
    shell.openExternal(event.target.href)
  }
})

/* HELPER FUNCTIONS */

//take the string of HTML and parse it into a DOM tree
const parseResponse = (text) => {
  return parser.parseFromString(text, 'text/html')
}

//traverse the DOM tree to find the <title> node
const findTitle = (nodes) => {
  return nodes.querySelector('title').innerText
}

//a function to persist links in local storage
const storeLink = (title, url) => {
  localStorage.setItem(url, JSON.stringify({ title: title, url: url }))
}

//clear out url form input
const clearForm = () => {
  newLinkUrl.value = null
}

//a function for getting links from local storage
const getLinks = () => {
  //get an array of all the keys currently stored in localStorage and for each key, gets its value and parses it from JSON into a JavaScript object
  return Object.keys(localStorage).map((key) =>
    JSON.parse(localStorage.getItem(key))
  )
}

//a function for creating DOM nodes from link data
const convertToElement = (link) => {
  return `<div class="link">
            <h3>${link.title}</h3>
            <p><a href="${link.url}">${link.url}</a></p>
          </div>`
}

//a function to render all links and add them to the DOM
const renderLinks = () => {
  //convert all the links to HTML elements and combines them
  const linkElements = getLinks().map(convertToElement).join('')
  //replace the contents of the links section with the combined link elements
  linksSection.innerHTML = linkElements
}

//a function to display an error message in case of error
const handleError = (error, url) => {
  //set the contents of the error message element if fetching a link fails
  errorMessage.innerHTML = `
      There was an issue adding "${url}": ${error.message}
    `.trim()
  //clear the error message after 5 seconds
  setTimeout(() => (errorMessage.innerText = null), 5000)
}

const validateResponse = (response) => {
  //if the response was successful, passes it along to the next promise
  if (response.ok) {
    return response
  }
  //throws an error if the request received a 400- or 500-series response
  throw new Error(`Status code of ${response.status} ${response.statusText}`)
}

/* CALL THESE WHEN LOAD PAGE*/

//render all of the links when the page initially loads
renderLinks()
