const electron = require("electron");

// Allows us to read registry items
const regedit = require("regedit");

// Allows us to interact with the file system
const fs = require('fs');

// Parse vdf files
const vdf = require('simple-vdf');

class Game
{
	constructor(name, installDir)
	{
		this.name = name;
		this.installDir = installDir;
	}
}

class GameLocator
{
	// Get all the games on the users computer
	getAllGames()
	{

	}

	// Get all games installed through steam on the users computer
	getSteamGames()
	{
		/* ---- Get the directory that steam is installed in ---- */
		const steamRegAddress32 = "HKEY_LOCAL_MACHINE\\SOFTWARE\\Valve\\Steam";
		const steamRegAddress64 = "HKEY_LOCAL_MACHINE\\SOFTWARE\\Wow6432Node\\Valve\\Steam";

		var steamInstallDir = "";

		if (process.env.PROCESSOR_ARCHITECTURE == "AMD64" || true)
		{
			// If we are on a 64bit machine
			// Fetch the steam
			regedit.list([steamRegAddress32, steamRegAddress64], function (err, result)
			{
				if (err) throw err;

				if (result[steamRegAddress64])
				{
					// If we got a result from the 64bit address
					steamInstallDir = result[steamRegAddress64].values.InstallPath;
				}
				else if (result[steamRegAddress32])
				{
					// If we got a result from the 32bit address
					steamInstallDir = result[steamRegAddress32].values.InstallPath;
				}
			});
		}

		if (steamInstallDir = "")
		{
			// If, as far as we know, steam is not installed, then return the 0 games that were found
			return [];
		}

		/* ---- Get each of the steam game libraries ---- */

		var steamLibraries = [];

		// Read steamapps/libraryfolders.vdf
		fs.readFile(steamInstallDir + "\steamapps\libraryfolders.vdf", (err, data) =>
		{
			if (err) throw err;
			console.log(data);
			json = vdf.stringify(vdf.parse(data));
			vdf_text = data);
		});
	}
}