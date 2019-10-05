
function test()
{
	SpreadsheetApp.getActive().getSheetByName(CONST.pages.extraGames.name).getRange(2, 1, 10, 3).setValue();
}