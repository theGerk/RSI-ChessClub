
function checkDuplicateNames() {
	let data = SpreadsheetApp.getActive().getSheetByName(CONST.pages.mainPage.active).getDataRange().getValues();
	data.shift();
	let count: { [name: string]: number } = {};
	for (let c = 0; c < data.length; c++) {
		let name = data[c][CONST.pages.mainPage.columns.name];
		if (count[name])
			count[name]++;
		else
			count[name] = 1;
	}
	for (let d in count)
		if (count[d] === 1)
			delete count[d];
	SpreadsheetApp.getUi().alert(JSON.stringify(count));
}


function recalculate() {
	let history = FrontEnd.Data.getHistoryArray();
	history.sort((a, b) => a.date.localeCompare(b.date));
	let club = FrontEnd.Master.getClub();

	for (let player in club) {
		let current = club[player];
		current.gamesPlayed = 0;
		current.pairingHistory = [];
		current.rating = Glicko.makeNewRating();
	}

	function countGame(game: FrontEnd.Games.IGame, isTournament: boolean) {
		let white = club[game.white];
		let black = club[game.black];

		white.gamesPlayed++;
		black.gamesPlayed++;

		if (isTournament) {
			white.pairingHistory.push({ opponent: black.name, white: true });
			black.pairingHistory.push({ opponent: white.name, white: false });
		}
	}

	let everyoneRating: Glicko.IRating[] = [];
	for (let player in club)
		everyoneRating.push(club[player].rating);

	for (let i = 0; i < history.length; i++) {
		let today = history[i];
		let games = today.games;
		for (let j = games.Other.length - 1; j >= 0; j--)
			countGame(games.Other[j], false);
		for (let j = games.Tournament.Games.length - 1; j >= 0; j--)
			countGame(games.Tournament.Games[j], true);
		for (let j = games.Tournament.Byes.length - 1; j >= 0; j--)
			club[games.Tournament.Byes[j]].pairingHistory.push(null);

		Glicko.doRatingPeriod(games.Other.concat(games.Tournament.Games).map(x => {
			return {
				black: club[x.black].rating,
				white: club[x.white].rating,
				result: x.result,
			};
		}), everyoneRating);
	}

	FrontEnd.Master.setClub(club);
}

function getUsers() {
	SpreadsheetApp.getActive().getEditors().forEach(x => Logger.log(x.getUserLoginId() + '\t:\t' + x.getEmail()));
}


function devfuc() {
	FrontEnd.SignoutSheet.GenerateSignoutSheet();
}


function testy() {
	FrontEnd.Master.setPermisions();
}

function reformatdata() {
	var range = SpreadsheetApp.getActive().getSheetByName(CONST.pages.history.name).getRange(CONST.pages.history.columns.games + 1, 2, 20);
	var dat = range.getValues();
	var formated = dat.map(x =>
		[(x => {
			var val = x[0];
			if (!val)
				return val;
			var o = JSON.parse(val);
			if (!o)
				return val;
			o.Tournament = { games: o.Tournament, byes: [] };
			return JSON.stringify(o);
		})(x)]);
	range.setValues(formated);
}


function importNewYear() {
	const SHEET_NAME = "Sheet37";
	const FIRST_NAME_ROW = 0;
	const ALT_FIRST_NAME_ROW = 2;
	const LAST_NAME_ROW = 1;
	const CHESS_KID_ROW = '';
	const NEW_RETURN_ROW = '';
	const GROUP_ROW = 3;
	const GRADE_ROW = 4;
	const TEACHER_ROW = 5;
	//const GENDER_ROW = ;


	let newPlayers = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME).getDataRange().getValues();
	const returnmap = { 'R': 'Return', 'N': 'New' };
	let club = FrontEnd.Master.getClub();
	for (let playerName in club) {
		club[playerName].active = false;
	}
	let notFound: number[] = [];
	for (let i = 1; i < newPlayers.length; i++) {
		let current = newPlayers[i];
		let playerName = (<string>current[FIRST_NAME_ROW]).trim() + " " + (<string>current[LAST_NAME_ROW]).trim();
		let inClub = club[playerName];
		if (!inClub)
			inClub = club[(<string>current[ALT_FIRST_NAME_ROW]).trim() + " " + (<string>current[LAST_NAME_ROW]).trim()];
		//if(!inClub && current[NEW_RETURN_ROW] != 'N')
		//{
		//	function fallbackMatching()
		//	{
		//		//check for chessKid match
		//		for(let player in club)
		//			if(club[player].chesskid == current[CHESS_KID_ROW])
		//				return club[player];

		//		notFound.push(i);
		//	}

		//	inClub = fallbackMatching();
		//}
		if (!inClub && current[GROUP_ROW] != 'Green')
			notFound.push(i);

		if (inClub) {
			inClub.level = 'Return';
			inClub.active = true;
			inClub.group = current[GROUP_ROW];
			inClub.grade = current[GRADE_ROW];
			inClub.teacher = current[TEACHER_ROW];
			inClub.gender = '';//current[GENDER_ROW];
			inClub.chesskid = '';//current[CHESS_KID_ROW];
			inClub.name = playerName;
		}
		else/* if(current[6] == 'N')*/ {
			club[playerName] = {
				guid: Utilities.getUuid(),
				group: current[GROUP_ROW],
				grade: current[GRADE_ROW],
				teacher: current[TEACHER_ROW],
				level: 'New',
				gender: '',//current[GENDER_ROW],
				chesskid: '',
				rating: Glicko.makeNewRating(),
				pairingHistory: [],
				active: true,
				gamesPlayed: 0,
				name: playerName,
			};
		}
	}
	let backgrounds: string[][] = [];
	let blankline: null[] = [];
	let coloredline: string[] = [];
	for (let i = 0; i < newPlayers[0].length; i++)
		blankline.push(null), coloredline.push('red');
	for (let i = 0; i < newPlayers.length; i++)
		backgrounds.push(blankline);
	for (let i = 0; i < notFound.length; i++)
		backgrounds[notFound[i]] = coloredline;
	SpreadsheetApp.getActive().getSheetByName(SHEET_NAME).getDataRange().setBackgrounds(backgrounds);
	//FrontEnd.Master.setClub(club);
}


function initGuid() {
	let players = FrontEnd.Master.getClub();
	for (var p in players) {
		if (players[p].guid)
			players[p].guid = Utilities.getUuid();
	}
	FrontEnd.Master.setClub(players);
}


function generateAttendanceSheets() {
	FrontEnd.Attendance.GenerateAttendanceSheets();
}


function makePrintableSignin() {
	let ss = SpreadsheetApp.getActiveSpreadsheet();
	let players = FrontEnd.Master.getActivePlayersArray();
	let splitPlayers = { k: <IPlayer[]>[], '1': <IPlayer[]>[], '2-3': <IPlayer[]>[], '3-4': <IPlayer[]>[] };
	for (let i = 0; i < players.length; i++) {
		let grouping: IPlayer[];
		switch (players[i].grade) {
			case 'K':
				grouping = splitPlayers.k;
				break;
			case 1:
				grouping = splitPlayers[1];
				break;
			case 2:
			case 3:
				grouping = splitPlayers["2-3"];
				break;
			case 4:
			case 5:
				grouping = splitPlayers["4-5"];
				break;
		}
		if (grouping)
			grouping.push(players[i]);
	}
	for (let g in splitPlayers) {
		let grouping: IPlayer[] = splitPlayers[g];
		let sheet = TemplateSheets.generate(ss, ss.getSheetByName('Template-Sign In Printoff'), grouping.length, `Signin printoff ${g}`);
		let range = sheet.getRange(2, 1, grouping.length, 3);
		let data = grouping.map(x => [x.name, x.group, '']);
		range.setValues(data);
	}

}


function testCheckIn() {
	FrontEnd.Attendance.checkin("cff9d30d-5ad0-4be6-bdc1-46cfb1b30ab2");
}