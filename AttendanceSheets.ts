namespace FrontEnd
{
	export namespace Attendance
	{
		/** A row of attendance data */
		export interface IAttendanceData
		{
			/** An individual's name [Unique] */
			name: string;
			/** The group they are in */
			group: string;
			/** If they are here today */
			attending: boolean;
			/** If they should be paired */
			pair: boolean;
		}


		/**
		 * gets an attendance sheet as a map from name to player data
		 * @param sheet the sheet object to get data from
		 * @returns object maping player names to player object
		 */
		function getAttendanceSheetMap(sheet: GoogleAppsScript.Spreadsheet.Sheet): { [name: string]: IAttendanceData }
		{
			return Benji.makeMap(getAttendanceSheetArray(sheet), (s) => s.name);
		}

		/**
		 * gets all data from a single attendance sheet
		 * @param sheet the sheet object to get data from
		 * @returns array of all players in this group
		 */
		function getAttendanceSheetArray(sheet: GoogleAppsScript.Spreadsheet.Sheet): IAttendanceData[]
		{
			//first verify that this is an attendance sheet
			let sheetMetadata = Benji.metadata.getMetadataOnSheet(sheet);
			if(!sheetMetadata[CONST.pages.attendance.metadata.key])
				return null;

			let groupName = sheetMetadata[CONST.pages.attendance.metadata.groupName].getValue();

			//continue on now that things are all hunky dory
			let raw = sheet.getDataRange().getValues();
			raw.shift();	//remove first row
			//maps each row, effectivly returning my descired array
			return raw.map(row =>
			{
				return {
					name: row[CONST.pages.attendance.columns.name],
					group: groupName,
					attending: row[CONST.pages.attendance.columns.attendance],
					pair: row[CONST.pages.attendance.columns.pair]
				};
			});
		}

		/**
		 * Creates an attendance sheet for the given group (TEST version, will be replaced?)
		 * 
		 * @param group the group name that we are generating for, defaults to all groups (optional)
		 */
		export function GenerateAttendanceSheets(group?: string): void
		{
			let spreadsheet = SpreadsheetApp.getActive();
			let templateSheet = spreadsheet.getSheetByName(CONST.pages.attendance.template);
			let groups = FrontEnd.Master.getGroupsObject();
			let groupData = FrontEnd.Groups.getData();

			/**
			 * generate a group attendance page given its name
			 * 
			 * @param groupName the group's name
			 * @returns The generated sheet
			 */
			function makePage(groupName: string): GoogleAppsScript.Spreadsheet.Sheet
			{
				let currentGroup = groups[groupName];
				if(!currentGroup || currentGroup.length === 0)
					throw new Error(`${groupName} is not a group`);

				let sheetName = groupName[0].toUpperCase() + groupName.substring(1) + " attendance";

				//if the attendance sheet already exists, keep the checked boxes checked.
				let oldSheet = spreadsheet.getSheetByName(sheetName);
				let record: { [name: string]: IAttendanceData };
				if(oldSheet)
					record = getAttendanceSheetMap(oldSheet);
				else
					record = {};

				//make the new sheet
				let currentSheet = TemplateSheets.generate(spreadsheet, templateSheet, currentGroup.length, sheetName, 1);

				let defaultParingSetting = groupData[groupName].defaultPair;

				let outputData: any[][] = [];
				for(let i = 0; i < currentGroup.length; i++)
				{
					let currentPerson = currentGroup[i];

					let newRow = [];

					newRow[CONST.pages.attendance.columns.name] = currentPerson.name;
					newRow[CONST.pages.attendance.columns.rating] = Math.round(currentPerson.rating.rating);

					if(record[currentPerson.name])
					{
						newRow[CONST.pages.attendance.columns.attendance] = record[currentPerson.name].attending;
						newRow[CONST.pages.attendance.columns.pair] = record[currentPerson.name].pair;
					}
					else
					{
						newRow[CONST.pages.attendance.columns.attendance] = false;
						newRow[CONST.pages.attendance.columns.pair] = defaultParingSetting;
					}

					outputData.push(newRow);
				}
				currentSheet.getRange(2, 1, outputData.length, outputData[0].length).setValues(outputData);

				//add metadata
				currentSheet.addDeveloperMetadata(CONST.pages.attendance.metadata.key, GoogleAppsScript.Spreadsheet.DeveloperMetadataVisibility.PROJECT);
				currentSheet.addDeveloperMetadata(CONST.pages.attendance.metadata.groupName, groupName, GoogleAppsScript.Spreadsheet.DeveloperMetadataVisibility.PROJECT);

				//set color
				try
				{
					currentSheet.setTabColor(groupName);
				}
				catch(er) { }

				return currentSheet;
			}


			//go through each group and create attendance sheet
			if(group)
				makePage(group)
			else
				for(let groupName in groups)
					makePage(groupName);
		}
	}
}