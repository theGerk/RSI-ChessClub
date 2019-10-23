/// <reference path="Constants.ts"/>


function onOpen(e)
{

	let x = SpreadsheetApp.getUi()
		.createMenu(CONST.menu.mainInterface.name)
		.addItem("refresh attendance", (<any>GenerateAttendanceSheets).name)
		.addItem('generate pairings', (<any>CreatePairingSheets).name)
		.addItem('cement results', (<any>WeeklyUpdate).name);
	if(Session.getActiveUser().getEmail().toLowerCase() === 'benji@altmansoftwaredesign.com')
		x.addSeparator()
			.addItem("test", (<any>test).name)
	x.addToUi();
}


function GenerateAttendanceSheets() { FrontEnd.Attendance.GenerateAttendanceSheets(); }

function CreatePairingSheets() { FrontEnd.Attendance.RecordAndPair(); }

/**
 * Consumes and commits to storage the games played
 * Does rating changes
 */
function WeeklyUpdate()
{
	let gamesResults = FrontEnd.Games.getResults();
	let club = FrontEnd.Master.getClub();


	//do ratings
	let everyoneRatings: Glicko.IRating[] = [];
	for(let name in club)
		everyoneRatings.push(club[name].rating);

	Glicko.doRatingPeriod(name => club[name].rating, gamesResults.Tournament.concat(gamesResults.Other), everyoneRatings);


	//add games to history
	let tourny = gamesResults.Tournament;
	for(let i = tourny.length - 1; i >= 0; i--)
	{
		let currentGame = tourny[i];
		club[currentGame.white].pairingHistory.push({ opponent: currentGame.black, white: true });
		club[currentGame.black].pairingHistory.push({ opponent: currentGame.white, white: false });
	}


	//write data
	FrontEnd.Games.recordAndRemove();
	FrontEnd.Master.setClub(club);
}