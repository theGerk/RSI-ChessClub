/// <reference path="Constants.ts"/>


function onOpen(e)
{
	SpreadsheetApp.getUi().createMenu(CONST.menu.mainInterface.name).addItem("test", (<any>test).name).addItem("refresh attendance", (<any>GenerateAttendanceSheets).name).addItem('generate pairings', (<any>CreatePairingSheets).name).addToUi();
}


function GenerateAttendanceSheets() { FrontEnd.Attendance.GenerateAttendanceSheets(); }

function CreatePairingSheets() { FrontEnd.Attendance.RecordAndPair(); }