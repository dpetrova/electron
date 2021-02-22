const Application = require('spectron').Application
const assert = require('assert')
const path = require('path')
const electronPath = require('electron') // Require Electron from the binaries included in node_modules

// let electronPath = path.join(
//   __dirname,
//   '..',
//   'node_modules',
//   '.bin',
//   'electron'
// )

// if (process.platform === 'win32') {
//   electronPath += '.cmd'
// }

describe('Clipmaster 9000', function () {
  //increase Mocha’s default timeout because launching the application can take a while
  this.timeout(10000)

  //create and start the application before each test
  beforeEach(() => {
    this.app = new Application({
      path: electronPath,
      args: [path.join(__dirname, '../app/main.js')], //point to the root directory of the application itself as a starting point for the application
    })

    return this.app.start()
  })

  //stop the application after each test
  afterEach(() => {
    if (this.app && this.app.isRunning()) {
      return this.app.stop()
    }
  })

  it('shows an initial window', async () => {
    //after the app start, get a count of all of the windows
    const count = await this.app.client.getWindowCount()
    //verify that Clipmaster creates only one window
    return assert.strictEqual(count, 1)
    //return expect(count).toEqual(1)
  })

  it('has the correct title', async () => {
    //after the window has loaded, gets the title of that window
    await this.app.client.waitUntilWindowLoaded()
    const title = await this.app.client.getTitle()
    //verify that title is correct
    return assert.strictEqual(title, 'Clipmaster 9000')
    //return expect(title).toEqual('Clipmaster 9000');
  })

  it('does not have the developer tools open', async () => {
    await this.app.client.waitUntilWindowLoaded()
    //get a reference to the browserWindows instance and see if dev tools are opened
    const devToolsAreOpen = await this.app.browserWindow.isDevToolsOpened()
    return assert.strictEqual(devToolsAreOpen, false)
    //return expect(devToolsAreOpen).toBe(false)
  })

  it('has a button with the text "Copy from Clipboard"', async () => {
    //use query selector to get h1
    const button = await this.app.client.$('#copy-from-clipboard')
    //grab the text from the element
    const buttonText = await button.getText()
    return assert.strictEqual(buttonText, 'Copy from Clipboard')
    //return expect(buttonText).toBe('Copy from Clipboard');
  })

  it('should not have any clippings when the application starts up', async () => {
    //wait until the window has loaded its content
    await this.app.client.waitUntilWindowLoaded()
    //use WebdriverIO’s API to find all the clipping list items on the page
    const clippings = await this.app.client.$$('.clippings-list-item')
    //verify that, by default, there are no clipping list items
    return assert.strictEqual(clippings.length, 0)
    //return expect(clippings.length).toBe(0)
  })

  it('should have one clipping when the "Copy From Clipboard" button has been pressed', async () => {
    await this.app.client.waitUntilWindowLoaded()
    //trigger a click event on the Copy from Clipboard button
    const btn = await this.app.client.$('#copy-from-clipboard')
    await btn.click()
    const clippings = await this.app.client.$$('.clippings-list-item')
    return assert.strictEqual(clippings.length, 1)
    //return expect(clippings.length).toBe(1);
  })

  it('should successfully remove a clipping', async () => {
    await this.app.client.waitUntilWindowLoaded()
    const btnCopyFromClipboard = await this.app.client.$('#copy-from-clipboard')
    await btnCopyFromClipboard.click()
    //get element .clippings-list-item
    const clippingSection = await this.app.client.$('.clippings-list-item')
    //move the cursor to selected element (hover) to trigger the Remove button to appear
    await clippingSection.moveTo({ xOffset: 0, yOffset: 0 })
    const removeBtn = await this.app.client.$('.remove-clipping')
    await removeBtn.click()
    const clippings = await this.app.client.$$('.clippings-list-item')
    return assert.strictEqual(clippings.length, 0)
    //return expect(clippings.length).toBe(0)
  })

  it('should have the correct text in a new clipping', async () => {
    await this.app.client.waitUntilWindowLoaded()
    //access Electron’s API to write text to the system’s clipboard
    await this.app.electron.clipboard.writeText('Vegan Ham')
    const btnCopyFromClipboard = await this.app.client.$('#copy-from-clipboard')
    await btnCopyFromClipboard.click()
    const clippingtextElement = await this.app.client.$('.clipping-text')
    const clippingText = await clippingtextElement.getText()
    return assert.strictEqual(clippingText, 'Vegan Ham')
    //return expect(clippingText).toBe('Vegan Ham')
  })

  it('it should write the text of the clipping to the clipboard', async () => {
    await this.app.client.waitUntilWindowLoaded()
    //write text to the clipboard using Electron’s API
    await this.app.electron.clipboard.writeText('Vegan Ham')
    const btnCopyFromClipboard = await this.app.client.$('#copy-from-clipboard')
    //click the Copy from Clipboard button
    await btnCopyFromClipboard.click()
    //write some other text to the clipboard
    await this.app.electron.clipboard.writeText('Something totally different')
    const btnCopyClipping = await this.app.client.$('.copy-clipping')
    //click the button that should copy the text back to the clipboard
    await btnCopyClipping.click()
    //read the text from the clipboard
    const clipboardText = await this.app.electron.clipboard.readText()
    //verify that the text is now the content of the clipping and not the text we last wrote to the clipboard in our test
    return assert.strictEqual(clipboardText, 'Vegan Ham')
    //return expect(clipboardText).toBe('Vegan Ham');
  })
})
