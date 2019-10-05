namespace FrontEnd
{
	export namespace Data
	{
		export interface IData
		{
			date: string;
			//TODO change type of games
			games: { Tournament: FrontEnd.Games.IGame[], Other: FrontEnd.Games.IGame[] };
			attendance: { [name: string]: FrontEnd.Attendance.IAttendanceData };
		}


		function mapping(row: any[]): IData
		{
			return {
				date: Benji.getWeekString(row[CONST.pages.history.columns.date]),
				attendance: JSON.parse(row[CONST.pages.history.columns.attendance]),
				games: JSON.parse(row[CONST.pages.history.columns.games]),
			};
		}

		function reverseMapping(row: IData): any[]
		{
			let output = [];
			output[CONST.pages.history.columns.attendance] = JSON.stringify(row.attendance);
			output[CONST.pages.history.columns.date] = row.date;
			output[CONST.pages.history.columns.games] = JSON.stringify(row.games);
			return output;
		}

		/**
		 * Creates a blank data, if no date is passed in the assumed date is today.
		 * @param date the date as either a date object or anything that can be passed to the Date constructor (only as a single argument);
		 */
		export function newData(date?: number | Date | string): IData
		{
			if(date === undefined)
				return { date: Benji.getWeekString(), attendance: {}, games: null };
			else if(date instanceof Date)
				return { date: Benji.getWeekString(date), attendance: {}, games: null };
			else
				return { date: Benji.getWeekString(new Date(date)), attendance: {}, games: null };
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

		function modifyNamesForAttendance(data: { [name: string]: FrontEnd.Attendance.IAttendanceData }, nameMap: { [oldName: string]: string })
		{
			for(let name in data)
				if(name.hasOwnProperty(name))
					data[name].name = nameMap[name];
		}

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

		function modifyNamesForGames(data: { Tournament: FrontEnd.Games.IGame[], Other: FrontEnd.Games.IGame[] }, nameMap: { [oldName: string]: string })
		{
			modifyNamesForGameArray(data.Tournament, nameMap);
			modifyNamesForGameArray(data.Other, nameMap);
		}

		function modifyNamesForDay(data: IData, nameMap: { [oldName: string]: string })
		{
			modifyNamesForGames(data.games, nameMap);
			modifyNamesForAttendance(data.attendance, nameMap);
		}

		export function modifyNames(nameMap: { [oldName: string]: string })
		{
			let data = getData();
			for(let date in data)
				modifyNamesForDay(data[date], nameMap);
			writeData(data);
		}
	}
}