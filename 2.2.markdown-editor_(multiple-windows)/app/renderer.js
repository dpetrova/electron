//remote module perform interprocess communication from the renderer process to the main process
//ipcRenderer module can send messages to the main process; and it can also listen for messages that were sent from the main process using webContents.send()
const { remote, ipcRenderer } = require('electron')
//low-level compiler for parsing markdown
const marked = require('marked')
const path = require('path')

//remote module has its own require method that allows it to require functionality from the main process in our renderer process
const mainProcess = remote.require('./main.js') //require the main process

//get a reference to the current window in the renderer process
const currentWindow = remote.getCurrentWindow()

//cache DOM selectors
const markdownView = document.querySelector('#markdown')
const htmlView = document.querySelector('#html')
const newFileButton = document.querySelector('#new-file')
const openFileButton = document.querySelector('#open-file')
const saveMarkdownButton = document.querySelector('#save-markdown')
const revertButton = document.querySelector('#revert')
const saveHtmlButton = document.querySelector('#save-html')
const showFileButton = document.querySelector('#show-file')
const openInDefaultButton = document.querySelector('#open-in-default')

//declaring global variables for keeping track of the current working file
let filePath = null
let originalContent = ''

const isDifferentContent = (content) => content !== markdownView.value

//convert Markdown to HTML
const renderMarkdownToHtml = (markdown) => {
  htmlView.innerHTML = marked(markdown, { sanitize: true })
}

//checking for changes whenever the user types and re-render the HTML when Markdown changes
markdownView.addEventListener('keyup', (event) => {
  const currentContent = event.target.value
  renderMarkdownToHtml(currentContent)
  updateUserInterface(currentContent !== originalContent)
})

//triggering Open File dialog in the main process
openFileButton.addEventListener('click', () => {
  mainProcess.getFileFromUser(currentWindow)
})

//triggering createWindow() in the main process
newFileButton.addEventListener('click', () => {
  mainProcess.createWindow()
})

//triggering the Save File dialog box from the main process
saveHtmlButton.addEventListener('click', () => {
  mainProcess.saveHtml(currentWindow, htmlView.innerHTML)
})

saveMarkdownButton.addEventListener('click', () => {
  mainProcess.saveMarkdown(currentWindow, filePath, markdownView.value)
})

//reverting markdown content of to last saved content
revertButton.addEventListener('click', () => {
  markdownView.value = originalContent
  renderMarkdownToHtml(originalContent)
})

//listening for messages on the "file-opened" channel
ipcRenderer.on('file-opened', (event, file, content) => {
  //prompt user of insaved changes in previous opened file
  if (
    (currentWindow.isDocumentEdited() || currentWindow.isCurrentlyEdited) &&
    isDifferentContent(content)
  ) {
    //use the remote module to trigger the dialog box from the main process
    const result = remote.dialog.showMessageBoxSync(currentWindow, {
      type: 'warning',
      title: 'Overwrite Current Unsaved Changes?',
      message:
        'Opening a new file in this window will overwrite your unsaved changes. Open this file anyway?',
      buttons: ['Yes', 'Cancel'],
      defaultId: 0,
      cancelId: 1,
    })

    //if the user cancels, returns from the function early
    if (result === 1) return
  }

  //render new opened file
  renderFile(file, content)
})

ipcRenderer.on('file-changed', (event, file, content) => {
  if (!isDifferentContent(content)) return
  const result = remote.dialog.showMessageBoxSync(currentWindow, {
    type: 'warning',
    title: 'Overwrite Current Unsaved Changes?',
    message: 'Another application has changed this file. Load changes?',
    buttons: ['Yes', 'Cancel'],
    defaultId: 0,
    cancelId: 1,
  })

  if (result === 1) return

  renderFile(file, content)
})

const renderFile = (file, content) => {
  //update path and original content of currently open file
  filePath = file
  originalContent = content

  //update the Markdown content in the UI
  markdownView.value = content
  //update the HTML content in the UI
  renderMarkdownToHtml(content)
  //update the window’s title bar whenever a new file is opened
  updateUserInterface(false)
}

const updateUserInterface = (isEdited) => {
  let title = 'Fire Sale'

  //if a file is open, prepends the name of that file to the title
  if (filePath) {
    title = `${path.basename(filePath)} - ${title}`
  }
  //if document has unsaved changes
  if (isEdited) {
    title = `${title} (Edited)`
  }

  //update the title of the window
  currentWindow.setTitle(title)
  //if isEdited is true, then updates the window accordingly
  currentWindow.setDocumentEdited(isEdited) //work only for macOS
  currentWindow.isCurrentlyEdited = isEdited //change our implementation of tacking rditing of file

  //if the document is not edited, disable Save and revert buttons
  saveMarkdownButton.disabled = !isEdited
  revertButton.disabled = !isEdited
}

/* Implement Drag and Drop */

//disable the default browser behavior
document.addEventListener('dragstart', (event) => event.preventDefault())
document.addEventListener('dragover', (event) => event.preventDefault())
document.addEventListener('dragleave', (event) => event.preventDefault())
document.addEventListener('drop', (event) => event.preventDefault())

//when a user is dragging a file, we have access only to its metadata
const getDraggedFile = (event) => event.dataTransfer.items[0]
//after the user has officially dropped the file, we have access to the file itself
const getDroppedFile = (event) => event.dataTransfer.files[0]
//checks to see if the type of file being dragged is either of the two types supported by the application
const fileTypeIsSupported = (file) => {
  return ['text/plain', 'text/markdown'].includes(file.type)
}

//adding and removing classes on dragover and dragleave to give the user a visual clue as to whether the drop is going to be successful
markdownView.addEventListener('dragover', (event) => {
  const file = getDraggedFile(event)

  if (fileTypeIsSupported(file)) {
    //if the file type is supported, adds a CSS class to indicate this is a valid place to drop the file
    markdownView.classList.add('drag-over')
  } else {
    //if the file type is not supported, adds a CSS class to indicate that this file is not accepted
    markdownView.classList.add('drag-error')
  }
})

//when the user removes the file from the target area, we’ll clean up any classes that were added and restore the UI to its default state
markdownView.addEventListener('dragleave', () => {
  markdownView.classList.remove('drag-over')
  markdownView.classList.remove('drag-error')
})

//open dropped file
markdownView.addEventListener('drop', (event) => {
  const file = getDroppedFile(event)

  if (fileTypeIsSupported(file)) {
    //if the file type is supported, the renderer process communicates with the main process to open it
    mainProcess.openFile(currentWindow, file.path)
  } else {
    //if the file type is not supported, the application alerts the user
    alert('That file type is not supported')
  }

  //clean up any classes that were added and restore the UI to its default state
  markdownView.classList.remove('drag-over')
  markdownView.classList.remove('drag-error')
})
