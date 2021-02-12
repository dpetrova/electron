# electron

Electron tutorial projects from "Electron in Action" by Steven Kinney

1.url-marker -> a simple Electron application that fetch given url, extract its html title and store data in localStorage
2.1.markdown-editor -> markdown editor which:
	- allow to write and edit markdown text, 
	- convert it to html and render it; 
	- open file via open dialog;
	- use single window for the UI
2.2.markdown-editor -> markdown editor which:
	- allow to write and edit markdown text, 
	- convert it to html and render it; 
	- open file via open dialog; 
	- use multiple windows for the UI; 
	- support drag-n-drop files;
	- watch the filesystem for changes;
 	- add files to the operating system’s list of recently opened files
	- update window title bar;
	- prompt dialogs alerting user before discard unsaved changes
2.3.markdown-editor -> markdown editor which:
	- allow to write and edit markdown text, 
	- convert it to html and render it; 
	- open file via open dialog; 
	- use multiple windows for the UI; 
	- support drag-n-drop files;
	- watch the filesystem for changes;
 	- add files to the operating system’s list of recently opened files
	- update window title bar;
	- prompt dialogs alerting user before discard unsaved changes;
	- have custom application and context menus
	- dynamically enabling menu items
	- build with electron-packager
3.1.clipmaster -> a simple application that:
	- live in the operating system’s menu bar or system tray
	- reading from and writing to the system clipboard
	- registering global shortcuts that listen for specific keystrokes even when the application is not in use
	- triggering native notifications in macOS and Windows 10
	- publish clippings to https://api.github.com/gists
4.jetsetter -> an application for keeping track of the things you need to pack; this covers:
	- set up electron-compile to transpile CoffeeScript, TypeScript, and upcoming JS features (using Babel) without a build step in an Electron application
	- using electron-compile to transpile Less, Sass, and Stylus to CSS and Jade to HTML
	- building a simple Electron application using React, Sass, and Jade
	- set up live reload

