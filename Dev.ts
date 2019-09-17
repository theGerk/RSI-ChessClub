///<reference path="Constants.ts"/>

function test()
{
	TemplateSheets.generate(SpreadsheetApp.getActive(), SpreadsheetApp.getActive().getSheetByName(CONST.templates.attendance.name), 10, "testSheet");
}

