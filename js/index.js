const { shell } = require('electron');


// Converts camel case to regular case
function fromCamelCase(str)
{
	var endStr;
	for (var i = 0; i < str.length; i++)
	{
		var char = str.charAt(i);
		var prevChar = str.charAt(i - 1);

		// If its the first character
		if (i === 0)
		{
			endStr = char.toUpperCase();
		}
		// If this char is uppercase
		else if (char === char.toUpperCase() && prevChar === prevChar.toLowerCase())
		{
			endStr += " " + char;
		} else
		{
			endStr += char;
		}
	}

	return endStr;
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
			else if ([2, 3].includes(j))
			{
				// Double clicking on a file will open it
				tabCell.addEventListener("dblclick", function ()
				{
					console.log("HI   " + this.innerHTML);
					shell.showItemInFolder(this.innerHTML);
				});
				tabCell.style.cursor = "pointer";
				tabCell.title = "Double Click to Open";
			}
			tabCell.innerHTML = thisCellData;
		}
	}
}


const gl = require("./GameLocator.js");

gl.getAllGames(function (games)
{
	
	jsonToTable(games, document.getElementById("foundGamesTbl"));
});