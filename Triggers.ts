function onOpen(e)
{
	SpreadsheetApp.getUi().createMenu(CONST.menu.mainInterface.name).addItem("test", test.name).addItem("refresh attendance", GenerateAttendanceSheets.name).addToUi();
}
