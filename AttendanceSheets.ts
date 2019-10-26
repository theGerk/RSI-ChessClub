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
			/** Their rating (rounded) */
			rating: number;
		}

		/**
		 * gets an attendance sheet as a map from name to player data
		 * @param sheet the sheet object to get data from
		 * @returns object mapping player names to player object
		 */
		function getAttendanceSheetMap(sheet: GoogleAppsScript.Spreadsheet.Sheet): { data: { [name: string]: IAttendanceData }, group: string }
		{
			let data = getAttendanceSheetArray(sheet);
			if(data === null)
				return null;
			return { data: Benji.makeMap(data.data, (s) => s.name), group: data.group };
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
				data: raw.map(mapping(groupName)),
				group: groupName
			};
		}


		function mapping(groupName: string): (row: any[]) => IAttendanceData
		{
			return function(row: any[])
			{
				return {
					name: row[CONST.pages.attendance.columns.name],
					group: groupName,
					attending: row[CONST.pages.attendance.columns.attendance],
					pair: row[CONST.pages.attendance.columns.pair],
					rating: row[CONST.pages.attendance.columns.rating],
				};
			}
		}


		function reverseMapping(row: IAttendanceData): any[]
		{
			let output = [];
			output[CONST.pages.attendance.columns.attendance] = row.attending;
			output[CONST.pages.attendance.columns.name] = row.name;
			output[CONST.pages.attendance.columns.pair] = row.pair;
			output[CONST.pages.attendance.columns.rating] = row.rating;
			return output;
		}


		function getSheetName(groupName: string) { return groupName[0].toUpperCase() + groupName.substring(1) + " attendance"; }

		//TODO redo this... Wow it was clever but boy is it stupid.
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
			let historyData = FrontEnd.Data.getData()[Benji.friday()];

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

				let sheetName = getSheetName(groupName);

				//if the attendance sheet already exists, keep the checked boxes checked.
				let oldSheet = spreadsheet.getSheetByName(sheetName);
				let record: { [name: string]: IAttendanceData };
				if(oldSheet)
				{
					let tmp = getAttendanceSheetMap(oldSheet);
					if(tmp === null)
						record = {};
					else
						record = tmp.data;
				}
				else
					record = {};

				//create data
				let defaultParingSetting = groupData[groupName].defaultPair;
				let outputData: any[][] = [];
				for(let i = 0; i < currentGroup.length; i++)
				{
					let currentPerson = currentGroup[i];
					let currentPersonName = currentPerson.name;

					if(record[currentPersonName])
						outputData.push(reverseMapping(record[currentPersonName]));
					else if(historyData && historyData.attendance[currentPersonName])
						outputData.push(reverseMapping(historyData.attendance[currentPersonName]));
					else
						outputData.push(reverseMapping({
							attending: false,
							group: groupName,
							name: currentPersonName,
							pair: defaultParingSetting,
							rating: (typeof (currentPerson.rating.rating) === 'number' && isFinite(currentPerson.rating.rating)) ? Math.round(currentPerson.rating.rating) : Glicko.INITIAL_RATING,
						}));
				}

				//sort output data
				outputData = outputData.sort((a, b) =>
				{
					let nameA = (<string>a[CONST.pages.mainPage.columns.name]).toLowerCase();
					let nameB = (<string>b[CONST.pages.mainPage.columns.name]).toLowerCase();
					if(nameA === nameB)
						return 0;
					else if(nameA < nameB)
						return -1;
					else
						return 1;
				});

				//make the new sheet
				let currentSheet = TemplateSheets.generate(spreadsheet, templateSheet, currentGroup.length, sheetName, 1);

				//add metadata
				currentSheet.addDeveloperMetadata(CONST.pages.attendance.metadata.key, SpreadsheetApp.DeveloperMetadataVisibility.PROJECT);
				currentSheet.addDeveloperMetadata(CONST.pages.attendance.metadata.groupName, groupName, SpreadsheetApp.DeveloperMetadataVisibility.PROJECT);

				//populate the data
				currentSheet.getRange(2, 1, outputData.length, outputData[0].length).setValues(outputData);

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
		 * @returns A map from players to their attendance data
		 */
		function getAllAttendanceData(): { [name: string]: IAttendanceData }
		{
			let arr: IAttendanceData[] = [];

			let sheets = SpreadsheetApp.getActive().getSheets();
			for(let i = sheets.length - 1; i >= 0; i--)
			{
				let attendanceResult = getAttendanceSheetArray(sheets[i]);

				//check to make sure it is actually a sheet
				if(attendanceResult !== null)
				{
					arr.push(...attendanceResult.data);
				}
			}

			return Benji.makeMap(arr, entry => entry.name);
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
		 * Gets data from attendance sheets and submits it to the data page
		 * @param hard Should the data on the history page be rewriten or ammended (True => rewrite, False => ammend)
		 */
		export function SubmitAttendance(hard?: boolean)
		{
			let data = FrontEnd.Data.getData();
			let todayKey = Benji.friday();

			//if we need to create new data
			if(hard || !data[todayKey])
				data[todayKey] = FrontEnd.Data.newData(todayKey);

			//this mutates the data to update it with current attendance
			let todayData = getTodayData(data[todayKey]);

			FrontEnd.Data.writeData(data);
			RemoveAttendanceSheets();
			return todayData;
		}

		/**
		 * Changes value of input by updating with the current attendance data, will overwrite but will not delete entries that are not present
		 * @param input Optional, if left out will use the current day's from the data page
		 */
		export function getTodayData(input?: FrontEnd.Data.IData): { [name: string]: IAttendanceData }
		{
			let historicalData: { [name: string]: IAttendanceData };

			//set historical data based on different input types
			if(input === undefined)
			{
				let tmp = FrontEnd.Data.getData()[Benji.friday()];
				if(tmp)
					historicalData = tmp.attendance;
				else
					historicalData = {};
			}
			else
				historicalData = input.attendance;

			//get current data
			let currentData = getAllAttendanceData();


			if(historicalData)
			{
				//update historical data with current data
				for(let player in currentData)
					historicalData[player] = currentData[player];
				return historicalData;
			}
			else
				return currentData;
		}


		export function modifyNames(nameMap: { [oldName: string]: string })
		{
			let data = getAllAttendanceData();

			for(let name in nameMap)
				if(data.hasOwnProperty(name))
					data[name].name = name;

			updateAttendance(data);
		}


		function updateAttendance(input: { [name: string]: IAttendanceData })
		{
			//split into groups
			let groups: { [groupName: string]: IAttendanceData[] } = {};
			for(let name in input)
			{
				let current = input[name];
				if(groups[current.group])
					groups[current.group].push(current);
				else
					groups[current.group] = [current];
			}

			for(let groupName in groups)
			{
				writeAttendance(groups[groupName], groupName);
			}
		}


		function writeAttendance(input: IAttendanceData[], groupName: string)
		{
			RemoveAttendanceSheets(groupName);
			if(input.length === 0)
				return;

			let spreadsheet = SpreadsheetApp.getActive();
			let sheetName = getSheetName(groupName);

			//make the new sheet
			let currentSheet = TemplateSheets.generate(spreadsheet, spreadsheet.getSheetByName(CONST.pages.attendance.template), input.length, sheetName, 1);

			//populate the data
			let outputData: any[][] = input.sort((a, b) =>
				{
					let nameA = a.name.toLowerCase();
					let nameB = b.name.toLowerCase();
					if(nameA > nameB)
						return 1;
					else if(nameA < nameB)
						return -1;
					else
						return 0;
			}).map(reverseMapping);

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
		}
	}
}