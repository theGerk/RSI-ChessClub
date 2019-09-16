/// <reference path="Constants.ts"/>


//describes a person in our club
interface IPlayer
{
	name: string;
	glicko: Glicko.IRating;
	group: string;
	grade: number | string;
};



function test()
{
	TemplateSheets.generate(SpreadsheetApp.getActive(), SpreadsheetApp.getActive().getSheetByName(CONST.templates.attendance.name), 10, "testSheet");
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
	let groups: { [groupName: string]: IPlayer[] } = {};
	for (let i = 1; i < data.length; i++)
	{
		let group = data[i][CONST.pages.mainPage.columns.group].toLowerCase();

		//may need to be edited when IPerson is edited
		let person: IPlayer = {
			name: data[i][CONST.pages.mainPage.columns.name],
			glicko: {
				rating: data[i][CONST.pages.mainPage.columns.rating],
				deviation: data[i][CONST.pages.mainPage.columns.ratingDeviation],
				volatility: data[i][CONST.pages.mainPage.columns.ratingVolatility]
			},
			grade: data[i][CONST.pages.mainPage.columns.grade],
			group: data[i][CONST.pages.mainPage.columns.group]
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
		let currentSheet = TemplateSheets.generate(spreadsheet, templateSheet, currentGroup.length, sheetName, 1);

		let outputData: any[][] = [];
		for (let i = 0; i < currentGroup.length; i++)
		{
			let currentPerson = currentGroup[i];

			//smarter version of this
			let newRow = [];

			newRow[CONST.templates.attendance.columns.name] = currentPerson.name;
			newRow[CONST.templates.attendance.columns.rating] = Math.round(currentPerson.glicko.rating);
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
