// Converts camel case to regular case (Thank you https://stackoverflow.com/a/4149393/7641587);
function fromCamelCase(str)
{
	// insert a space before all caps
	str = str.replace(/([A-Z])/g, ' $1');

	// uppercase the first character
	str = str.replace(/^./, function (str) { return str.toUpperCase(); })

	return str;
}


// Function to convert json into an HTML table. Modified from https://www.encodedna.com/javascript/populate-json-data-to-html-table-using-javascript.htm (Thank you!)
function jsonToTable(json, table)
{
	// EXTRACT VALUE FOR HTML HEADER.
	// ('Book ID', 'Book Name', 'Category' and 'Price')
	var col = [];
	for (var i = 0; i < json.length; i++)
	{
		for (var key in json[i])
		{
			if (col.indexOf(key) === -1)
			{
				col.push(key);
			}
		}
	}

	// CREATE DYNAMIC TABLE.
	//var table = table;
	table.innerHTML = "";

	// CREATE HTML TABLE HEADER ROW USING THE EXTRACTED HEADERS ABOVE.

	var tr = table.insertRow(-1);                   // TABLE ROW.

	for (var i = 0; i < col.length; i++)
	{
		var th = document.createElement("th");      // TABLE HEADER.
		th.innerHTML = fromCamelCase(col[i]);
		tr.appendChild(th);
	}

	// ADD JSON DATA TO THE TABLE AS ROWS.
	for (var i = 0; i < json.length; i++)
	{

		tr = table.insertRow(-1);

		for (var j = 0; j < col.length; j++)
		{
			var tabCell = tr.insertCell(-1);
			var thisCellData = json[i][col[j]];
			if (typeof thisCellData == "undefined")
			{
				thisCellData = "Not Found";
			}
			tabCell.innerHTML = thisCellData;
		}
	}
}


const gl = require("./GameLocator.js");

gl.getSteamGames(function (games)
{
	gl.getSteamInstallDir(function (dir)
	{
		games.forEach(function (item, index)
		{
			gl.getSteamConfigDir(item, "182883226", dir, function (game)
			{
				games[index] = game;
				if (index >= games.length - 1)
				{
					jsonToTable(games, document.getElementById("foundGamesTbl"));
				}
			});
		});
	});
});