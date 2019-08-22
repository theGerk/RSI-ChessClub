//describes a person in our club
interface IPerson
{
	name: string;
	rating: number;
	ratingDeviation: number;
	ratingVolatility: number;
};



function test()
{
	generatePageFromTemplate(SpreadsheetApp.getActive(), SpreadsheetApp.getActive().getSheetByName(CONST.templates.attendance.name), 10, "testSheet");
}



/**
 * Deletes a sheet with a given name.
 * 
 * @param spreadsheet the spreadsheet to delete this sheet from
 * @param sheetName Name of the sheet
 * @returns true if a sheet is deleted, false otherwise
 */
function deleteSheet(spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet, sheetName: string): boolean
{
	let sheet = spreadsheet.getSheetByName(sheetName);
	if (sheet)
	{
		spreadsheet.deleteSheet(sheet);
		return true;
	}
	else
		return false;
}

/**
 * Creates a sheet from a template and populates n row with correct formating, formula, and data validations
 *
 * @param spreadsheet the spreadsheet we are working in (both template and output sheet are in this spreadsheet)
 * @param template initial template sheet
 * @param rows number of rows to generate
 * @param sheetName the new sheet's name (optional)
 * @param sheetIndex the new sheet's index (optional)
 * @returns the generated sheet
 */
function generatePageFromTemplate(spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet, template: GoogleAppsScript.Spreadsheet.Sheet, rows: number, sheetName?: string, sheetIndex?: number)
{
	let sheet: GoogleAppsScript.Spreadsheet.Sheet;
	if (sheetName)
	{
		//delete any other sheet with this name
		deleteSheet(spreadsheet, sheetName);

		if (sheetIndex)
			sheet = spreadsheet.insertSheet(sheetName, sheetIndex, { template: template });
		else
			sheet = spreadsheet.insertSheet(sheetName, { template: template });
	}
	else
	{
		if (sheetIndex)
			sheet = spreadsheet.insertSheet(sheetIndex, { template: template });
		else
			sheet = spreadsheet.insertSheet({ template: template });
	}

	let range = sheet.getDataRange().offset(1, 0, 1);
	let columns = range.getNumColumns();
	let validations = range.getDataValidations()[0];
	let formulas = range.getFormulasR1C1()[0];

	for (let col = 0; col < columns; col++)
	{
		let target = sheet.getRange(2, col + 1, rows);

		//data validation
		target.setDataValidation(validations[col]);

		//formating
		range.getCell(1, col + 1).copyFormatToRange(sheet, col + 1, col + 1, 2, rows + 1);

		//formula
		let currentFormula = formulas[col];
		if (currentFormula)
			target.setFormulaR1C1(currentFormula);
	}

	sheet.showSheet();
	sheet.addDeveloperMetadata("template", template.getSheetName());

	return sheet;
}

/**
 * Creats the groups object, a mapping from group names to an array of all the people in them
 * 
 * @returns groups object, 
 */
function getGroupsObject()
{
	let spreadsheet = SpreadsheetApp.getActive();
	let data = spreadsheet.getSheetByName(CONST.pages.mainPage.name).getDataRange().getValues();


	//create object maping group name to array of group members
	let groups: { [groupName: string]: IPerson[] } = {};
	for (let i = 1; i < data.length; i++)
	{
		let group = data[i][CONST.pages.mainPage.columns.group].toLowerCase();

		//may need to be edited when IPerson is edited
		let person: IPerson = {
			name: data[i][CONST.pages.mainPage.columns.name],
			rating: data[i][CONST.pages.mainPage.columns.rating],
			ratingDeviation: data[i][CONST.pages.mainPage.columns.ratingDeviation],
			ratingVolatility: data[i][CONST.pages.mainPage.columns.ratingVolatility]
		};

		if (group in groups)
			groups[group].push(person);
		else
			groups[group] = [person];
	}

	return groups;
}

/**
 * Creates an attendance sheet for the given group (TEST version, will be replaced?)
 * 
 * @param group the group name that we are generating for, defaults to all groups (optional)
 */
function GenerateAttendanceSheets(group?: string): void
{
	let spreadsheet = SpreadsheetApp.getActive();
	let templateSheet = spreadsheet.getSheetByName(CONST.templates.attendance.name);
	let groups = getGroupsObject();


	/**
	 * generate a group attendance page given its name
	 * 
	 * @param groupName the group's name
	 * @returns The generated sheet
	 */
	function makePage(groupName: string): GoogleAppsScript.Spreadsheet.Sheet
	{
		let currentGroup = groups[groupName];
		let sheetName = groupName[0].toUpperCase() + groupName.substring(1) + " attendance";

		//if the attendance sheet already exists, keep the checked boxes checked.
		let record: { [name: string]: { attendance: boolean, dontPair: boolean } } = {};
		let oldSheet = spreadsheet.getSheetByName(sheetName);
		if (oldSheet)
		{
			let data = oldSheet.getDataRange().getValues();
			for (let i = 1; i < data.length; i++)
			{
				let currentRow = data[i];
				record[currentRow[CONST.templates.attendance.columns.name]] = {
					attendance: currentRow[CONST.templates.attendance.columns.attendance],
					dontPair: currentRow[CONST.templates.attendance.columns.dontPair],
				};
			}
		}

		//make the new sheet
		let currentSheet = generatePageFromTemplate(spreadsheet, templateSheet, currentGroup.length, sheetName, 1);

		let outputData: any[][] = [];
		for (let i = 0; i < currentGroup.length; i++)
		{
			let currentPerson = currentGroup[i];

			//smarter version of this
			let newRow = [];

			newRow[CONST.templates.attendance.columns.name] = currentPerson.name;
			newRow[CONST.templates.attendance.columns.rating] = currentPerson.rating;
			if (record[currentPerson.name])
			{
				newRow[CONST.templates.attendance.columns.attendance] = record[currentPerson.name].attendance;
				newRow[CONST.templates.attendance.columns.dontPair] = record[currentPerson.name].dontPair;
			}
			else
			{
				newRow[CONST.templates.attendance.columns.attendance] = false;
				newRow[CONST.templates.attendance.columns.dontPair] = false;
			}

			outputData.push(newRow);
		}
		currentSheet.getRange(2, 1, outputData.length, outputData[0].length).setValues(outputData);

		//set color
		try
		{
			currentSheet.setTabColor(groupName);
		}
		catch (er) { }

		return currentSheet;
	}


	//go through each group and create attendance sheet
	if (group)
		makePage(group)
	else
		for (let groupName in groups)
			makePage(groupName);
}
