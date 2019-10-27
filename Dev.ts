
function checkDuplicateNames()
{
	let data = SpreadsheetApp.getActive().getSheetByName(CONST.pages.mainPage.name).getDataRange().getValues();
	data.shift();
	let count: { [name: string]: number } = {};
	for(let c = 0; c < data.length; c++)
	{
		let name = data[c][CONST.pages.mainPage.columns.name];
		if(count[name])
			count[name]++;
		else
			count[name] = 1;
	}
	for(let d in count)
		if(count[d] === 1)
			delete count[d];
	SpreadsheetApp.getUi().alert(JSON.stringify(count));
}

function getUsers()
{
	SpreadsheetApp.getActive().getEditors().forEach(x => Logger.log(x.getUserLoginId() + '\t:\t' + x.getEmail()));
}