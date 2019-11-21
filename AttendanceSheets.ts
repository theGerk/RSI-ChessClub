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
			if(!_cache[groupName])
			{
				_cache[groupName] = sheet.getDataRange().getValues();
				_cache[groupName].shift();	//remove first row
			}

			//maps each row, effectively returning my descried array
			return {
				data: _cache[groupName].map(mapping(groupName)),
				group: groupName
			};
		}

		var _cache: { [groupName: string]: any[][] } = {};

		/**
		 * gets mapping function based on group name
		 * @param groupName the group name
		 */
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

		/**
		 * Gets what the sheet name is expected to be for a specific group's attendance page
		 * @param groupName The name of the group, should not be case sensitive, but why tempt fate?
		 * @returns the expected name for the attendance page for this group
		 */
		function getSheetName(groupName: string) { return groupName[0].toUpperCase() + groupName.substring(1).toLowerCase() + " attendance"; }

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

				if(!groupData[groupName].hasAttendance)
					return;

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
				let outputData: IAttendanceData[] = [];
				for(let i = 0; i < currentGroup.length; i++)
				{
					let currentPerson = currentGroup[i];
					let currentPersonName = currentPerson.name;

					if(record[currentPersonName])
						outputData.push(record[currentPersonName]);
					else if(historyData && historyData.attendance[currentPersonName])
						outputData.push(historyData.attendance[currentPersonName]);
					else
						outputData.push({
							attending: false,
							group: groupName,
							name: currentPersonName,
							pair: defaultParingSetting,
							rating: (typeof (currentPerson.rating.rating) === 'number' && isFinite(currentPerson.rating.rating)) ? Math.round(currentPerson.rating.rating) : Glicko.INITIAL_RATING,
						});
				}

				//sort output data
				outputData = outputData.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

				writeAttendance(outputData, groupName);
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
			let spreadsheet = SpreadsheetApp.getActive();
			let sheets = getSheets();

			//go ahead and delete some sheets
			for(let i = sheets.length - 1; i >= 0; i--)
			{
				let metadata = getAttendanceSheetMetadata(sheets[i]);
				if(metadata !== null)
				{
					let groupName = metadata[CONST.pages.attendance.metadata.groupName].getValue();
					if(!group || groupName === group)
					{
						spreadsheet.deleteSheet(sheets[i]);
						delete _cache[groupName];
					}
				}
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


		/**
		 * Changes names as needed given a set of name changes
		 * @param nameMap A set of name changes, maps from old names to new names. Must be valid, this is not checked.
		 */
		export function modifyNames(nameMap: { [oldName: string]: string })
		{
			let data = getAllAttendanceData();

			for(let name in nameMap)
				if(data.hasOwnProperty(name))
					data[name].name = name;

			let sheets = getSheets();

			let groups: { [groupName: string]: boolean } = {};

			for(let i = 0; i < sheets.length; i++)
				groups[getAttendanceSheetMetadata(sheets[i])[CONST.pages.attendance.metadata.groupName].getValue()] = true;

			for(let x in data)
				if(!(data[x].group in groups))
					delete data[x];

			setAttendancePages(data);
		}


		/**
		 * Sets all the attendance pages
		 * @param input a map from names to attendance data.
		 */
		function setAttendancePages(input: { [name: string]: IAttendanceData })
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

		export function getSheets(): GoogleAppsScript.Spreadsheet.Sheet[]
		{
			return SpreadsheetApp.getActive().getSheets().filter(getAttendanceSheetMetadata);
		}

		/**
		 * Writes an array of attendance data to a page for a given group
		 * @param input Array of attendance data
		 * @param groupName The group that these data belong to
		 */
		function writeAttendance(input: IAttendanceData[], groupName: string)
		{
			if(input.length === 0)
			{
				RemoveAttendanceSheets(groupName);
				return;
			}

			let spreadsheet = SpreadsheetApp.getActive();
			let sheetName = getSheetName(groupName);

			//make the new sheet
			let currentSheet = TemplateSheets.generate(spreadsheet, spreadsheet.getSheetByName(CONST.pages.attendance.template), input.length, sheetName);

			//set permisions
			createPermision(currentSheet, input.length);

			//populate the data
			let outputData: any[][] = input.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase())).map(reverseMapping);

			currentSheet.getRange(2, 1, outputData.length, outputData[0].length).setValues(outputData);
			_cache[groupName] = outputData;

			//add metadata
			currentSheet.addDeveloperMetadata(CONST.pages.attendance.metadata.key, SpreadsheetApp.DeveloperMetadataVisibility.PROJECT);
			currentSheet.addDeveloperMetadata(CONST.pages.attendance.metadata.groupName, groupName, SpreadsheetApp.DeveloperMetadataVisibility.PROJECT);

			currentSheet.autoResizeColumns(1, outputData[0].length);

			//set color
			try
			{
				currentSheet.setTabColor(groupName);
			}
			catch(er) { }
		}

		/**
		 * 
		 * @param sheet
		 * @param rows The number of rows of data, this does not include the header
		 */
		function createPermision(sheet: GoogleAppsScript.Spreadsheet.Sheet, rows: number)
		{
			setPermision(sheet.protect().setUnprotectedRanges([
				sheet.getRange(2, CONST.pages.attendance.columns.pair + 1, rows, 1),
				sheet.getRange(2, CONST.pages.attendance.columns.attendance + 1, rows, 1)
			]));
		}

		function setPermision(protection: GoogleAppsScript.Spreadsheet.Protection)
		{
			Permision.setPermisions(protection, p => p.editPlayers || p.permision || p.permision);
		}

		export function setPermisions()
		{
			let sheets = getSheets();
			for(let i = sheets.length - 1; i >= 0; i--)
				setPermision(sheets[i].protect());
		}
	}
}