
function test()
{
	TemplateSheets.generate(SpreadsheetApp.getActive(), SpreadsheetApp.getActive().getSheetByName(CONST.pages.attendance.template), 10, "testSheet");
}