namespace FrontEnd
{
	/** All functionality for dealing with the history/data page. */
	export namespace Data
	{
		/** Hold information contained in a history row */
		export interface IData
		{
			/** The date in yyyy-MM-dd format. On the sheet this is postpended with a period, however here it removed. */
			date: string;
			/** The games that are played on the corresponding day. This is stored in JSON format on the page. */
			games: { Tournament: FrontEnd.Games.IGame[], Other: FrontEnd.Games.IGame[] };
			/** The attendance data for the day. */
			attendance: { [name: string]: FrontEnd.Attendance.IAttendanceData };
		}

		/**
		 * A map from a row of raw data to a data object.
		 * @param row A row of raw data taken from the sheet.
		 * @returns A data object
		 */
		function mapping(row: any[]): IData
		{
			return {
				date: (<string>row[CONST.pages.history.columns.date]).slice(0, -1),
				attendance: row[CONST.pages.history.columns.attendance] ? JSON.parse(row[CONST.pages.history.columns.attendance]) : {},
				games: row[CONST.pages.history.columns.games] ? JSON.parse(row[CONST.pages.history.columns.games]) : { Tournament: [], Other: [] },
			};
		}

		/**
		 * A map from a data object to a raw row to be written to the sheet
		 * @param row A data object
		 * @reutrns A row of raw data
		 */
		function reverseMapping(row: IData): any[]
		{
			let output = [];
			output[CONST.pages.history.columns.attendance] = JSON.stringify(row.attendance);
			output[CONST.pages.history.columns.date] = row.date + '.';
			output[CONST.pages.history.columns.games] = JSON.stringify(row.games);
			return output;
		}

		/**
		 * Creates a blank data, if no date is passed in the assumed date is today.
		 * @param date the date as either a date object or anything that can be passed to the Date constructor (only as a single argument);
		 */
		export function newData(date?: string): IData
		{
			if(date === undefined)
				return { date: Benji.friday(), attendance: {}, games: null };
			else
				if(date.match(/\d\d\d\d-\d\d-\d\d/))
					return { date: date, attendance: {}, games: null };
				else
					throw new Error(`Error creating new data entry, date: ${date} is invalid.`);
		}

		/** Gets all the data from the history page in order, with oldest first */
		export function getData(): { [date: string]: IData }
		{
			let data = SpreadsheetApp.getActive().getSheetByName(CONST.pages.history.name).getDataRange().getValues();
			data.shift();
			return Benji.makeMap(data.map(mapping), data => data.date);
		}

		/**
		 * writes all the data on the spreadsheet
		 * @param data the data the write
		 */
		export function writeData(data: { [date: string]: IData })
		{
			let output = Benji.objToArray_dropKey(data).map(reverseMapping);
			let sheet = SpreadsheetApp.getActive().getSheetByName(CONST.pages.history.name);
			sheet.getDataRange().offset(1, 0).clearContent();
			sheet.getRange(2, 1, output.length, output[0].length).setValues(output);
		}

		/**
		 * Modifies the names on the attendance part of a data object.
		 * @param data the attendance data portion of a data object
		 * @param nameMap A map from old names to new names.
		 */
		function modifyNamesForAttendance(data: { [name: string]: FrontEnd.Attendance.IAttendanceData }, nameMap: { [oldName: string]: string })
		{
			for(let name in data)
				if(name.hasOwnProperty(name))
					data[name].name = nameMap[name];
		}

		/**
		 * Takes an array of games as they would be stored in the data object and modifies the names given a name map
		 * @param data An array of games
		 * @param nameMap A map from old name to new name
		 */
		function modifyNamesForGameArray(data: FrontEnd.Games.IGame[], nameMap: { [oldName: string]: string })
		{
			for(let i = data.length - 1; i >= 0; i--)
			{
				let current = data[i];
				if(nameMap.hasOwnProperty(current.white))
					current.white = nameMap[current.white];
				if(nameMap.hasOwnProperty(current.black))
					current.black = nameMap[current.black];
			}
		}

		/**
		 * Takes the game part of a data object and modifies the names based on a name map
		 * @param data the games part of a data object.
		 * @param nameMap A map from old name to new name.
		 */
		function modifyNamesForGames(data: { Tournament: FrontEnd.Games.IGame[], Other: FrontEnd.Games.IGame[] }, nameMap: { [oldName: string]: string })
		{
			modifyNamesForGameArray(data.Tournament, nameMap);
			modifyNamesForGameArray(data.Other, nameMap);
		}

		/**
		 * Takes a data object and modifies the names for everything in it as needed
		 * @param data A data object to be mutated
		 * @param nameMap A map from old name to new name.
		 */
		function modifyNamesForDay(data: IData, nameMap: { [oldName: string]: string })
		{
			modifyNamesForGames(data.games, nameMap);
			modifyNamesForAttendance(data.attendance, nameMap);
		}

		/**
		 * Modifies all stored data on the data/history page to reflect a name change.
		 * @param nameMap A map from old names to new names.
		 */
		export function modifyNames(nameMap: { [oldName: string]: string })
		{
			let data = getData();
			for(let date in data)
				modifyNamesForDay(data[date], nameMap);
			writeData(data);
		}
	}
}