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