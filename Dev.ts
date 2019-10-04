
function test()
{
	let ss = SpreadsheetApp.getActive();
	let sheet = ss.getSheetByName('Template-Pairings_Formula');
	let rows = 10;
	TemplateSheets.generate(ss, sheet, rows, 'test');
}