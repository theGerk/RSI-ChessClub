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
		 * @returns object mapping player names to player object
		 */
		function getAttendanceSheetMap(sheet: GoogleAppsScript.Spreadsheet.Sheet): { [name: string]: IAttendanceData }
		{
			return Benji.makeMap(getAttendanceSheetArray(sheet).data, (s) => s.name);
		}

		/**
		 * Gets metadata from an attendance sheet, will return null if it is not an attendance sheet.
		 * This is the accepted way to determine if a sheet is an attendance sheet.
		 * @param sheet The sheet in question
		 * @returns the metadata on the sheet as an map from key to metadata objects if this is an attendance sheet, otherwise returns null
		 */
		function getAttendanceSheetMetadata(sheet: GoogleAppsScript.Spreadsheet.Sheet): Benji.metadata.IReturn
		{
			let metadata = Benji.metadata.getMetadataOnSheet(sheet);
			if(metadata.hasOwnProperty(CONST.pages.attendance.metadata.key))
				return metadata;
			else
				return null;
		}

		/**
		 * gets all data from a single attendance sheet
		 * @param sheet the sheet object to get data from
		 * @returns data: array of all players in this group, group: string name of the group
		 */
		function getAttendanceSheetArray(sheet: GoogleAppsScript.Spreadsheet.Sheet): { data: IAttendanceData[], group: string }
		{
			let sheetMetadata = getAttendanceSheetMetadata(sheet);

			//verify that this is an attendance sheet
			if(sheetMetadata === null)
				return null;

			let groupName = sheetMetadata[CONST.pages.attendance.metadata.groupName].getValue();

			//continue on now that things are all hunky dory
			let raw = sheet.getDataRange().getValues();
			raw.shift();	//remove first row
			//maps each row, effectively returning my descried array
			return {
				data: raw.map(row =>
				{
					return {
						name: row[CONST.pages.attendance.columns.name],
						group: groupName,
						attending: row[CONST.pages.attendance.columns.attendance],
						pair: row[CONST.pages.attendance.columns.pair]
					};
				}),
				group: groupName
			};
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
				if(!groupData.hasOwnProperty(groupName))
					throw new Error(`Group ${groupName} does not exist in groups page`);

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

				//find default pairing setting
				let defaultParingSetting = groupData[groupName].defaultPair;

				//populate the data
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
				currentSheet.addDeveloperMetadata(CONST.pages.attendance.metadata.key, SpreadsheetApp.DeveloperMetadataVisibility.PROJECT);
				currentSheet.addDeveloperMetadata(CONST.pages.attendance.metadata.groupName, groupName, SpreadsheetApp.DeveloperMetadataVisibility.PROJECT);

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

		/**
		 * Gets all data for attendance sheets
		 * @returns Object with following properties. Array: An array of all the attendance data, Map: a map from a group name to an array with just that group's attendance data. 
		 */
		function getAllAttendanceData(): { Array: IAttendanceData[], Map: { [groupName: string]: IAttendanceData[] } }
		{
			let arr: IAttendanceData[] = [];
			let map: { [groupName: string]: IAttendanceData[] } = {};

			let sheets = SpreadsheetApp.getActive().getSheets();
			for(let i = sheets.length - 1; i >= 0; i--)
			{
				let attendanceResult = getAttendanceSheetArray(sheets[i]);

				//check to make sure it is actually a sheet
				if(attendanceResult !== null)
				{
					arr.push(...attendanceResult.data);
					map[attendanceResult.group] = attendanceResult.data;
				}
			}

			return { Array: arr, Map: map };
		}

		/**
		 * Removes all the attendance sheets, or a single sheet for given group
		 * @param group the name of the group to be deleted, left blank to delete all sheets
		 */
		function RemoveAttendanceSheets(group?: string): void
		{
			//some weird voodoo here
			//If the group is defined then matchGroupCheck checks for it being the right group, otherwise it just returns true
			let matchGroupCheck: (metadata: Benji.metadata.IReturn) => boolean;
			if(group)
				matchGroupCheck = (metadata: Benji.metadata.IReturn) => metadata[CONST.pages.attendance.metadata.groupName].getValue() === group;
			else
				matchGroupCheck = () => true;

			let spreadsheet = SpreadsheetApp.getActive();
			let sheets = spreadsheet.getSheets();

			//go ahead and delete some sheets
			for(let i = sheets.length - 1; i >= 0; i--)
			{
				let metadata = getAttendanceSheetMetadata(sheets[i]);
				if(metadata !== null && matchGroupCheck(metadata))
					spreadsheet.deleteSheet(sheets[i]);
			}
		}

		/**
		 * Deletes the attendance pages and then records them on the data page
		 */
		export function RecordAndPair()
		{
			let attendanceData = getAllAttendanceData();

			let data = FrontEnd.Data.getData();
			let today = Benji.makeDayString();
			let todayData = data[today];

			//if today has no entry yet
			if(!todayData)
				todayData = data[today] = FrontEnd.Data.newData();

			//add in all attendance data
			todayData.attendance = attendanceData.Array;

			//make changes
			FrontEnd.TournamentPairings.GeneratePairings();
			FrontEnd.Data.writeData(data);
			RemoveAttendanceSheets();
		}

		export function getTodayData(date?: string): IAttendanceData[]
		{
			if(!date)
				date = Benji.makeDayString();

			//get data from log page
			let currentData = getAllAttendanceData().Array;
			let historicalData = FrontEnd.Data.getData()[date];
			if(historicalData)
				return currentData.concat(historicalData.attendance);
			else
				return currentData;
		}
	}
}