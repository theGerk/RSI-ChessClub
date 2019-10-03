namespace FrontEnd
{
	export namespace Data
	{
		export interface IData
		{
			date: string;
			//TODO change type of games
			games: any[];
			attendance: { [name: string]: FrontEnd.Attendance.IAttendanceData };
		}


		function mapping(row: any[]): IData
		{
			return {
				date: row[CONST.pages.history.columns.date],
				attendance: JSON.parse(row[CONST.pages.history.columns.attendance]),
				games: JSON.parse(row[CONST.pages.history.columns.games]),
			};
		}

		function reverseMapping(row: IData): any[]
		{
			let output = [];
			output[CONST.pages.history.columns.attendance] = JSON.stringify(row.attendance);
			output[CONST.pages.history.columns.date] = Benji.DayString(new Date(row.date));
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
				return { date: Benji.Today(), attendance: {}, games: [] };
			else if(date instanceof Date)
				return {
					date: Benji.DayString(date), attendance: {}, games: []
				};
			else
				return {
					date: Benji.DayString(new Date(date)), attendance: {}, games: []
				};
		}

		/** Gets all the data from the history page in order, with oldest first */
		export function getData(): IData[]
		{
			return SpreadsheetApp.getActive().getSheetByName(CONST.pages.history.name).getDataRange().getValues().map(mapping).sort((a,b) => );
		}

		/**
		 * Gets the data for the current day, if it does not exist then returns null.
		 * @param data Optional argument, if you already have all the data and just want to find the current day within it use this.
		 * @returns Will be an object representing the data associated with today, if a data object is passed in it will be a reference to an element of that array. If there is no data associated with today then returns null
		 */
		export function getToday(data?: IData[]): IData
		{
			if(!data)
				data = getData();
			let newestData = data[data.length - 1];
			if(newestData && newestData.date === Benji.Today())
				return newestData;
			else
				return null;
		}

		export function writeData(data: IData[])
		{
			let output = data.map(reverseMapping);
			let sheet = SpreadsheetApp.getActive().getSheetByName(CONST.pages.history.name);
			sheet.clear({ contentsOnly: true });
			sheet.getRange(1, 1, output.length, output[0].length).setValues(output);
		}
	}
}