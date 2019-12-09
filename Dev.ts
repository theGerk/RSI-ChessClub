
function checkDuplicateNames()
{
	let data = SpreadsheetApp.getActive().getSheetByName(CONST.pages.mainPage.active).getDataRange().getValues();
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


function recalculate()
{
	let history = FrontEnd.Data.getHistoryArray();
	history.sort((a, b) => a.date.localeCompare(b.date));
	let club = FrontEnd.Master.getClub();

	for(let player in club)
	{
		let current = club[player];
		current.gamesPlayed = 0;
		current.pairingHistory = [];
		current.rating = { deviation: undefined, rating: undefined, volatility: undefined };
	}

	function countGame(game: FrontEnd.Games.IGame, isTournament: boolean)
	{
		let white = club[game.white];
		let black = club[game.black];

		white.gamesPlayed++;
		black.gamesPlayed++;

		if(isTournament)
		{
			white.pairingHistory.push({ opponent: black.name, white: true });
			black.pairingHistory.push({ opponent: white.name, white: false });
		}
	}

	let everyoneRating: Glicko.IRating[] = [];
	for(let player in club)
		everyoneRating.push(club[player].rating);

	for(let i = 0; i < history.length; i++)
	{
		let today = history[i];
		let games = today.games;
		for(let j = games.Other.length - 1; j >= 0; j--)
			countGame(games.Other[j], false);
		for(let j = games.Tournament.length - 1; j >= 0; j--)
			countGame(games.Tournament[j], true);

		Glicko.doRatingPeriod(name => club[name].rating, games.Other.concat(games.Tournament), everyoneRating);
	}

	FrontEnd.Master.setClub(club);
}

function getUsers()
{
	SpreadsheetApp.getActive().getEditors().forEach(x => Logger.log(x.getUserLoginId() + '\t:\t' + x.getEmail()));
}


function devfuc()
{
	let players = FrontEnd.Master.getActivePlayersArray();
	let fakeAttendance: { [name: string]: FrontEnd.Attendance.IAttendanceData } = {};
	for(let i = 0; i < players.length; i++)
	{
		fakeAttendance[players[i].name] = {
			attending: true,
			name: players[i].name,
			group: players[i].group,
			pair: false,
			pairingPool: '',
			rating: players[i].rating.rating,
		};
	}
	FrontEnd.SignoutSheet.GenerateSignoutSheet(fakeAttendance);
}


function testy()
{
	FrontEnd.Master.setPermisions();
}