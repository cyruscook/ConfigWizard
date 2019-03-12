const electron = require("electron");

// Allows us to read registry items
const regedit = require("regedit");

// Allows us to interact with the file system
const fs = require('fs');

// Parse vdf files
const vdf = require('simple-vdf');

// Utility for parsing directory paths
const path = require('path');

class Game
{
	constructor(name, installDir, configDir, appID)
	{
		this.name = name;
		this.installDir = installDir;
		this.configDir = configDir;
		this.appID = appID;
	}
}

class SteamGame
{
	constructor(manifest, installDir)
	{
		this.appid = manifest.appid;
		this.name = manifest.name;
		this.installDir = path.normalize(installDir);
		this.lastOwner = manifest.lastOwner;

		this.__manifest = manifest;
	}

	__idToPersona()
	{
		var id = this.lastOwner;

		var usersDir = path.normalize(this.installDir.substr(this.__manifest.installDir.length + "\steamapps\common\\".length));
	}
}

// Get all the games on the users computer
getAllGames()
{
	var games = [];

	// Get all of the steam games
	games = games.concat(getSteamGames());

	return games;
}

// Get all games installed through steam on the users computer
getSteamGames(onFinish)
{
	function getSteamInstallDir(callback)
	{
		/* ---- Get the directory that steam is installed in ---- */
		const steamRegAddress32 = "HKLM\\SOFTWARE\\Valve\\Steam";
		const steamRegAddress64 = "HKLM\\SOFTWARE\\Wow6432Node\\Valve\\Steam";

		var steamInstallDir = "";
		// Fetch the steam install dir

		// First try the location on 32bit machines
		regedit.list([steamRegAddress32], function (err, result)
		{
			try
			{
				if (err)
				{
					throw err;
				}
				else if (result[steamRegAddress32].values.InstallPath.value)
				{
					// If we got a result from the 32bit address
					// Set this is the install dir
					steamInstallDir = result[steamRegAddress32].values.InstallPath.value;

					//console.log("Retrieved steam's install dir: " + steamInstallDir);
					callback(steamInstallDir);
				}
			}
			catch (e)
			{
				console.log("Could not find steam's 32bit regedit address, trying the 64 bit address");

				try
				{
					// If we didn't get a result at the 32bit address, let's try the 64 bit address
					regedit.list([steamRegAddress64], function (err, result)
					{
						if (err)
						{
							throw err;
						}
						else if (result[steamRegAddress64].values.InstallPath.value)
						{
							// If we got a result from the 64bit address
							// Set this is the install dir
							steamInstallDir = result[steamRegAddress64].values.InstallPath.value;

							//console.log("Retrieved steam's install dir: " + steamInstallDir);
							callback(steamInstallDir);
						}
					});
				}
				catch (e)
				{
					console.log("Could not find steam's 64 bit regedit address either! Assuming steam is not installed.");
				}
			}
		});
	}
		
	function getSteamLibraries(steamInstallDir, callback)
	{

		/* ---- Get each of the steam game libraries ---- */

		var steamLibraries = [];

		// The actual steam install dir is also a library!
		steamLibraries.push(steamInstallDir)

		// Read steamapps/libraryfolders.vdf
		fs.readFile(path.normalize(steamInstallDir + "\\steamapps\\libraryfolders.vdf"), "utf8", function (err, data)
		{
			if (err) throw err;

			// Parse the vdf format into json
			var json = vdf.parse(data);

			json = json.LibraryFolders;

			// Loop through every key in the json
			for (var i in json)
			{
				if (!isNaN(i))
				{
					// If it is a number (the number representing which library it is)
					// Add it's value to the array!
					steamLibraries.push(path.normalize(json[i]));
				}
			}

			callback(steamLibraries);
		});
	}

	function getSteamGames(steamLibraries, callback)
	{
		var steamGames = [];

		// For each steam library
		for (var x in steamLibraries)
		{
			// Get each file within it (Syncronous being used to keep track of which library we're in)
			var allFiles = fs.readdirSync(path.normalize(steamLibraries[x] + "\\steamapps\\"));
				
			allFiles.forEach(function (file)
			{
				// If it is a file listing a game (appmanifest_xxx.adf)
				if (file.substr(0, 11) == "appmanifest")
				{
					// Read the file
					var data = fs.readFileSync(path.normalize(steamLibraries[x] + "\\steamapps\\" + file), "utf8");
						
					// Parse the adf format into json (adf == vdf)
					var json = vdf.parse(data);

					// Add it's value to the array!
					var thisGame = new Game(json.AppState.name, path.normalize(steamLibraries[x] + "\\steamapps\\common\\" + json.AppState.installdir), void, json.AppState.appid);
						
					steamGames.push(thisGame);
				}
			});
				
			if (x >= (steamLibraries.length - 1))
			{
				callback(steamGames);
			}
		}
	}

	getSteamInstallDir(function (steamInstallDir)
	{
		if (steamInstallDir == "")
		{
			// If, as far as we know, steam is not installed, then return the 0 games that were found
			throw new Error("No steam installation directories found!");
			return [];
		}
		else
		{

			getSteamLibraries(steamInstallDir, function (steamLibraries)
			{
				/* ---- Now we have the steam libraries, retrieve the games in them! ---- */
				getSteamGames(steamLibraries, function (steamGames)
				{
					onFinish(steamGames);
				});
			});
		}
	});
}