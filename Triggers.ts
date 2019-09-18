/// <reference path="Constants.ts"/>


function onOpen(e)
{
	SpreadsheetApp.getUi().createMenu(CONST.menu.mainInterface.name).addItem("test", (<any>test).name).addItem("refresh attendance", (<any>GenerateAttendanceSheets).name).addToUi();
}


function GenerateAttendanceSheets() { FrontEnd.Attendance.GenerateAttendanceSheets(); }