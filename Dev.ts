
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

function recalculateGamesPlayed()
{
	let history = FrontEnd.Data.getData();
	let club = FrontEnd.Master.getClub();

	function countGame(game: FrontEnd.Games.IGame)
	{
		club[game.white].gamesPlayed++;
		club[game.black].gamesPlayed++;
	}

	for(let day in history)
	{
		let today = history[day].games;
		for(let i = today.Other.length - 1; i >= 0; i--)
			countGame(today.Other[i]);
		for(let i = today.Tournament.length - 1; i >= 0; i--)
			countGame(today.Tournament[i]);
	}
}

function getUsers()
{
	SpreadsheetApp.getActive().getEditors().forEach(x => Logger.log(x.getUserLoginId() + '\t:\t' + x.getEmail()));
}