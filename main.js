const electron = require("electron");
const url = require("url");
const path = require("path");

const { app, BrowserWindow } = electron;

// Main window
let mainWindow;

function createWindow()
{
	// Create a new window and define it as the main window
	mainWindow = new BrowserWindow({
		// Whether we include the menu and title bar
		frame: true,
		// Whether the window is visible by default
		show: false
	});

	// Load html into it
	mainWindow.loadURL(url.format({
		// Join the directory we're in + MainWindow.html
		pathname: path.join(__dirname, "index.html"),
		// It's on our system - use file protocol
		protocol: "file:",
		// Format with slashes
		slashes: true
	}));


	// Build our menu
	//const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
	// Then add it to the window
	// Remove the menu
	mainWindow.setMenu(null);

	mainWindow.toggleDevTools();

	mainWindow.on("ready-to-show", () =>
	{
		mainWindow.show();
	});

	// When the window is closed, dereference it
	mainWindow.on("closed", () =>
	{
		mainWindow = null;
		app.quit();
	})
}

// Called once the app is ready
app.on("ready", createWindow);