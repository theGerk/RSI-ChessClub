/// <reference path="Constants.ts"/>


function onOpen(e)
{

	let x = SpreadsheetApp.getUi()
		.createMenu(CONST.menu.mainInterface.name)
		.addItem("refresh attendance", (<any>GenerateAttendanceSheets).name)
		.addItem('generate pairings', (<any>CreatePairingSheets).name);
	if(Session.getActiveUser().getEmail().toLowerCase() === 'benji@altmansoftwaredesign.com')
		x.addItem("test", (<any>test).name)
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
	let games = FrontEnd.Games.getResults();
	let club = FrontEnd.Master.getClub();


	//do ratings
	let everyoneRatings: Glicko.IRating[] = [];
	for(let name in club)
		everyoneRatings.push(club[name].rating);

	Glicko.doRatingPeriod(name => club[name].rating, games, everyoneRatings);


	//write data
	FrontEnd.Games.recordAndRemove();
	FrontEnd.Master.setClub(club);
}