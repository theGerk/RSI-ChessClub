namespace FrontEnd
{
	export namespace Data
	{
		export interface IData
		{
			date: string;
			//TODO change type of games
			games: [];
			attendance: FrontEnd.Attendance.IAttendanceData[];
		}


		function mapping(row: any[]): IData
		{
			return {
				date: Benji.makeDayString(row[CONST.pages.history.columns.date]),
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
				return { date: Benji.makeDayString(), attendance: [], games: [] };
			else if(date instanceof Date)
				return {
					date: Benji.makeDayString(date), attendance: [], games: []
				};
			else
				return {
					date: Benji.makeDayString(new Date(date)), attendance: [], games: []
				};
		}

		/** Gets all the data from the history page in order, with oldest first */
		export function getData(): { [date: string]: IData }
		{
			let data = SpreadsheetApp.getActive().getSheetByName(CONST.pages.history.name).getDataRange().getValues();
			data.shift();
			return Benji.makeMap(data.map(mapping), data => data.date);
		}


		export function writeData(data: { [date: string]: IData })
		{
			let output = Benji.objToArray_dropKey(data).map(reverseMapping);
			let sheet = SpreadsheetApp.getActive().getSheetByName(CONST.pages.history.name);
			sheet.getDataRange().offset(1, 0).clearContent();
			sheet.getRange(2, 1, output.length, output[0].length).setValues(output);
		}
	}
}