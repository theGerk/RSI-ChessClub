
function test()
{
	let ss = SpreadsheetApp.getActive();
	let sheet = ss.getSheetByName(CONST.pages.extraGames.name);
	let vals = sheet.getDataRange().getValues();
	SpreadsheetApp.getUi().alert(vals.length.toString());
}