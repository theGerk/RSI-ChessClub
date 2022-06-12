
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
		current.rating = Glicko.makeNewRating();
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
		for(let j = games.Tournament.Games.length - 1; j >= 0; j--)
			countGame(games.Tournament.Games[j], true);
		for(let j = games.Tournament.Byes.length - 1; j >= 0; j--)
			club[games.Tournament.Byes[j]].pairingHistory.push(null);

		Glicko.doRatingPeriod(games.Other.concat(games.Tournament.Games).map(x =>
		{
			return {
				black: club[x.black].rating,
				white: club[x.white].rating,
				result: x.result,
			};
		}), everyoneRating);
	}

	FrontEnd.Master.setClub(club);
}

function getUsers()
{
	SpreadsheetApp.getActive().getEditors().forEach(x => Logger.log(x.getUserLoginId() + '\t:\t' + x.getEmail()));
}


function devfuc()
{
	FrontEnd.SignoutSheet.GenerateSignoutSheet();
}


function testy()
{
	FrontEnd.Master.setPermisions();
}

function reformatdata()
{
	var range = SpreadsheetApp.getActive().getSheetByName(CONST.pages.history.name).getRange(CONST.pages.history.columns.games + 1, 2, 20);
	var dat = range.getValues();
	var formated = dat.map(x =>
		[(x =>
		{
			var val = x[0];
			if(!val)
				return val;
			var o = JSON.parse(val);
			if(!o)
				return val;
			o.Tournament = { games: o.Tournament, byes: [] };
			return JSON.stringify(o);
		})(x)]);
	range.setValues(formated);
}


//function importNewYear()
//{

//	let newPlayers = SpreadsheetApp.getActive().getSheetByName("Sheet22").getDataRange().getValues();
//	const returnmap = { 'R': 'Return', 'N': 'New' };
//	let club = FrontEnd.Master.getClub();
//	for(let playerName in club)
//	{
//		club[playerName].active = false;
//	}
//	let notFound: number[] = [];
//	for(let i = 1; i < newPlayers.length; i++)
//	{
//		let current = newPlayers[i];
//		let playerName = (<string>current[1]).trim() + " " + (<string>current[2]).trim();
//		let inClub = club[playerName];
//		if(!inClub && current[6] != 'N')
//		{
//			function fallbackMatching()
//			{
//				//check for chessKid match
//				for(let player in club)
//					if(club[player].chesskid == current[8])
//						return club[player];

//				notFound.push(i);
//			}

//			inClub = fallbackMatching();
//		}

//		if(inClub)
//		{
//			inClub.level = returnmap[current[6]];
//			inClub.active = true;
//			inClub.group = current[3];
//			inClub.grade = current[4];
//			inClub.teacher = current[5];
//			inClub.gender = current[7];
//			inClub.chesskid = current[8];
//		}
//		else if(current[6] == 'N')
//		{
//			club[playerName] = {
//				group: current[3],
//				grade: current[4],
//				teacher: current[5],
//				level: returnmap[current[6]],
//				gender: current[7],
//				chesskid: current[8],
//				rating: Glicko.makeNewRating(),
//				pairingHistory: [],
//				active: true,
//				gamesPlayed: 0,
//				name: playerName,
//			};
//		}
//	}
//	let backgrounds: string[][] = [];
//	let blankline: null[] = [];
//	let coloredline: string[] = [];
//	for(let i = 0; i < newPlayers[0].length; i++)
//		blankline.push(null), coloredline.push('red');
//	for(let i = 0; i < newPlayers.length; i++)
//		backgrounds.push(blankline);
//	for(let i = 0; i < notFound.length; i++)
//		backgrounds[notFound[i]] = coloredline;
//	SpreadsheetApp.getActive().getSheetByName("Sheet22").getDataRange().setBackgrounds(backgrounds);
//	FrontEnd.Master.setClub(club);
//}


function initGuid() {
	let players = FrontEnd.Master.getClub();
	for (var p in players) {
		players[p].guid = Utilities.getUuid();
	}
	FrontEnd.Master.setClub(players);
}