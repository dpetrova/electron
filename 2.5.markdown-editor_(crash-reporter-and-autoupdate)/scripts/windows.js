const { createWindowsInstaller } = require('electron-winstaller')
const path = require('path')

//locates the path to the icons for the application
const iconPath = path.resolve(__dirname, '../icons/Icon.ico')

//create an installer -> this returns a promise
const result = createWindowsInstaller({
  title: 'Fire Sale',
  authors: 'DPetrova',
  //locates the packaged application that you first built
  appDirectory: path.resolve(__dirname, '../build/firesale-win32-x64'),
  //specify the directory where you would like the installer to be generated
  outputDirectory: path.resolve(
    __dirname,
    '../build/firesale-win32-x64-installer'
  ),
  icon: iconPath, //set the icon for the application itself
  setupIcon: iconPath, //set the icon for the installer packager
  setupExe: 'FireSaleSetup.exe',
  setupMsi: 'FireSaleSetup.msi',
})

result
  .then(() => console.log('Success')) //if the installer was created successfully, the promise resolves
  .catch((error) => console.error('Failed', error)) //if an error occurred and the promise fails, log the error to the console
