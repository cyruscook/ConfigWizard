const electron = require("electron");

// Allows us to read registry items
const regedit = require("regedit");

// Allows us to interact with the file system
const fs = require("fs");

// Parse vdf files
const vdf = require("simple-vdf");

// Utility for parsing directory paths
const path = require("path");

// Allows us to get os related file paths like documents directory
const os = require("os");

// Get directories in a folder (excluding files, thank you https://stackoverflow.com/a/18112359/7641587)
var fs_getDirs = function (rootDir, cb)
{
	fs.readdir(rootDir, function (err, files)
	{
		var err2;
		if (err)
		{
			throw err;
			err2 = err;
		}
		var dirs = [];
		for (var index = 0; index < files.length; ++index)
		{
			var file = files[index];
			if (file[0] !== '.')
			{
				var filePath = rootDir + '/' + file;
				fs.stat(filePath, function (err, stat)
				{
					if (stat.isDirectory())
					{
						dirs.push(this.file);
					}
					if (files.length === (this.index + 1))
					{
						return cb(err2, dirs);
					}
				}.bind({ index: index, file: file }));
			}
		}
	});
};


class Game
{
	constructor(name, platform, installDir, configDir, appID)
	{
		this.name = name;
		this.platform = platform;
		this.installDir = installDir;
		this.configDir = configDir;
		this.appID = appID;
	}
}


// Get all the games on the users computer
exports.getAllGames = function (callback)
{
	var games = [];

	var steamReady = false;
	var documentsReady = false;

	// Get all of the steam games
	exports.getSteamGames(function (steamGames)
	{
		exports.getSteamInstallDir(function (dir)
		{
			steamGames.forEach(function (item, index)
			{
				exports.getSteamConfigDir(item, "182883226", dir, function (game)
				{
					steamGames[index] = game;

					if (index >= steamGames.length - 1)
					{
						games = games.concat(steamGames);

						steamReady = true;
						if (steamReady && documentsReady)
						{
							callback(games);
						}
					}
				});
			});
		});
	});

	exports.getDocumentsConfigs(function (documentGames)
	{
		games = games.concat(documentGames);

		documentsReady = true;
		if (steamReady && documentsReady)
		{
			console.dir(games);
			callback(games);
		}
	});
};

exports.getSteamInstallDir = function (callback)
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
							steamInstallDir = path.normalize(result[steamRegAddress64].values.InstallPath.value);

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
	};

// Get all games installed through steam on the users computer
exports.getSteamGames = function (onFinish)
{
	function getSteamLibraries(steamInstallDir, callback)
	{

		/* ---- Get each of the steam game libraries ---- */

		var steamLibraries = [];

		// The actual steam install dir is also a library!
		steamLibraries.push(steamInstallDir);

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
					var thisGame = new Game(json.AppState.name, "Steam", path.normalize(steamLibraries[x] + "\\steamapps\\common\\" + json.AppState.installdir), undefined, "st_" + json.AppState.appid);
					// ("st_" prefix denotes a steam game)

					steamGames.push(thisGame);
				}
			});

			if (x >= (steamLibraries.length - 1))
			{
				callback(steamGames);
			}
		}
	}

	exports.getSteamInstallDir(function (steamInstallDir)
	{
		if (steamInstallDir == "")
		{
			// If, as far as we know, steam is not installed, then return the 0 games that were found
			throw new Error("No steam installation directories found!");
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
};

exports.getSteamConfigDir = function (game, userID, installDir, callback)
{
	var id = game.lastOwner;
	
	var configDir = path.normalize(installDir + "\\userdata\\" + userID + "\\" + game.appID.substring(3));
	
	fs.access(configDir, fs.constants.F_OK, function (err)
	{
		if (!err)
		{
			game.configDir = configDir;
		}
		callback(game);
	});
};

// Get the config for games which store it in the documents folder
exports.getDocumentsConfigs = function (callback)
{
	var games = [];

	// If we've retrieved 
	var AReady = false;
	var BReady = false;

	// Get the directory of the documents folder
	var docDir = os.homedir();


	// There are two types of these games

	// A, the selfish ones - the ones that store their config file directly in the Documents folder
	// Here they are, just to shame them (jk, to identify them)
	const typeA = [
		"Battlefield 1",
		"Battlefield 4",
		"Overwatch",
		"Rockstar Games" // And all of it's titles (like GTA V, etc). To simplify this I'm not going to get rockstar games individually, I'm just gonna leave them grouped together as they already are
	];
	// Let's retrieve all of group A
	fs_getDirs(docDir + "\\Documents", function (err, files)
	{
		if (err) throw err;
		
		files.forEach(function (value, index)
		{
			// For each folder in the documents directory
			// If it is a recognized game
			if (typeA.includes(value))
			{
				var platform = undefined;

				// Get the platform
				switch (value)
				{
					case typeA[0]: // BF1
					case typeA[1]: // BF4
						platform = "Origin";
						break;
					case typeA[2]: // Overwatch
						platform = "Blizzard";
						break;
					case typeA[3]: // Any rockstar game
						platform = "Rockstar";
						break;
				}


				// Create a new game object, and prepare it for being returned
				games.push(new Game(value, platform, undefined,  docDir + "\\Documents\\" + value));
			}

			if (index >= files.length - 1)
			{
				AReady = true;
				// If we've retrieved A & B callback
				if (AReady && BReady)
				{
					callback(games);
				}
			}
		});
	});



	// B, the considerate ones - these put their save game file in the "My Games" folder in your documents
	const typeB = [
		"Rainbow Six - Siege"
	];

	// Let's retrieve all of Group B
	fs_getDirs(path.normalize(docDir + "\\Documents\\My Games"), function (err, files)
	{
		if (err) throw err;

		files.forEach(function (value, index)
		{
			// For each folder in the documents directory
			// If it is a recognized game
			if (typeB.includes(value))
			{
				var platform = undefined;

				// Get the platform
				switch (value)
				{
					case typeB[0]: // R6
						platform = "Ubisoft";
						break;
				}

				// Create a new game object, and prepare it for being returned
				games.push(new Game(value, platform, undefined, docDir + "\\Documents\\My Games\\" + value));

				BReady = true;
				// If we've retrieved A & B callback
				if (AReady && BReady)
				{
					callback(games);
				}
			}
		});
	});
};