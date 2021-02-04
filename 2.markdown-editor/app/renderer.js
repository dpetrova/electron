//remote module perform interprocess communication from the renderer process to the main process
//ipcRenderer module can send messages to the main process; and it can also listen for messages that were sent from the main process using webContents.send()
const { remote, ipcRenderer } = require('electron')
//low-level compiler for parsing markdown
const marked = require('marked')

//remote module has its own require method that allows it to require functionality from the main process in our renderer process
const mainProcess = remote.require('./main.js') //require the main process

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

//convert Markdown to HTML
const renderMarkdownToHtml = (markdown) => {
  htmlView.innerHTML = marked(markdown, { sanitize: true })
}

//re-render the HTML when Markdown changes
markdownView.addEventListener('keyup', (event) => {
  const currentContent = event.target.value
  renderMarkdownToHtml(currentContent)
})

//triggering getFileFromUser() in the main process from the UI
openFileButton.addEventListener('click', () => {
  mainProcess.getFileFromUser()
})

//listening for messages on the "file-opened" channel
ipcRenderer.on('file-opened', (event, file, content) => {
  markdownView.value = content
  renderMarkdownToHtml(content)
})
