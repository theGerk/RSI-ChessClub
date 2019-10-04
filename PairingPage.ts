namespace FrontEnd
{
	export namespace Games
	{
		/** Stores data about a game that was played */
		export interface IGame
		{
			/** White player's name */
			white: string;
			/** Black player's name */
			black: string;
			/** Result for white (1 => win, .5 => draw, 0 => loss)*/
			result: number;
		}


		export namespace TournamentPairings
		{
			/** The result map */
			let resultMap = {
				'Win': 1,
				'Loss': 0,
				'Draw': .5,
				.5: 'Draw',
				0: 'Loss',
				1: 'Win',
			}

			/**
			 * Maps a row of data to a IGame
			 * @param row a row from Pairings page
			 */
			function mapping(row: any[]):IGame
			{
				return {
					white: row[CONST.pages.pairing.columns.whitePlayer],
					black: row[CONST.pages.pairing.columns.blackPlayer],
					result: resultMap[row[CONST.pages.pairing.columns.whiteResult]],
				};
			}

			/**
			 * Makes pairings based on given attendance data
			 * @param attendance the attendance object
			 */
			export function GeneratePairings(attendance: { [name: string]: FrontEnd.Attendance.IAttendanceData })
			{
				//get attendance data
				let club = FrontEnd.Master.getClub();

				let playersToPair: IPlayer[] = [];

				//get array of players to be paired
				for(let player in attendance)
				{
					let current = attendance[player];
					if(current.attending && current.pair)
						playersToPair.push(club[current.name]);
				}

				//pair everyone
				let pairings = Pairings.pair(playersToPair, true);

				//handle white and black players separately as otherwise equations can get overwritten
				let white: string[][] = [];
				let black: string[][] = [];
				for(let i = pairings.length - 1; i >= 0; i--)
				{
					let current = pairings[i];
					white.push([current.white.name]);
					black.push([current.black.name]);
				}

				let spreadsheet = SpreadsheetApp.getActive();

				//do things to the sheet
				let sheet = TemplateSheets.generate(spreadsheet, spreadsheet.getSheetByName(CONST.pages.pairing.template), pairings.length, CONST.pages.pairing.name, 1);
				sheet.getRange(2, CONST.pages.pairing.columns.whitePlayer + 1, pairings.length).setValues(white);
				sheet.getRange(2, CONST.pages.pairing.columns.blackPlayer + 1, pairings.length).setValues(black);
				sheet.autoResizeColumn(CONST.pages.pairing.columns.whitePlayer + 1);
				sheet.autoResizeColumn(CONST.pages.pairing.columns.blackPlayer + 1);
			}

			/** Deletes the pairing page, be careful */
			export function deletePage()
			{
				return TemplateSheets.deleteSheet(SpreadsheetApp.getActive(), CONST.pages.pairing.name);
			}

			/** Gets the data from pairings page */
			export function getData(): IGame[]
			{
				let sheet = SpreadsheetApp.getActive().getSheetByName(CONST.pages.pairing.name);
				let data = sheet.getDataRange().getValues();
				data.shift();
				return data.map(mapping);
			}
		}



		export namespace ExtraGames
		{
			/** The result map */
			let resultMap = {
				'W': 1,
				'L': 0,
				'D': .5,
				.5: 'D',
				0: 'L',
				1: 'W',
			}


			/**
			 * maps from row to an IGame
			 * @param row
			 */
			function mapping(row: any[]): IGame
			{
				return {
					black: row[CONST.pages.extraGames.columns.black],
					white: row[CONST.pages.extraGames.columns.white],
					result: resultMap[row[CONST.pages.extraGames.columns.result]],
				};
			}



			/** Resets the games played page */
			export function clear()
			{
				let spreadsheet = SpreadsheetApp.getActive();
				let sheet = spreadsheet.getSheetByName(CONST.pages.extraGames.name);
				let range = sheet.getDataRange();
				range.offset(1, 1, range.getLastRow() - 1, range.getLastColumn() - 1).clearContent();
			}


			/**
			 * Gets all the data stored in the games list as a single array
			 * 
			 * @returns an array of every game played.
			 */
			export function getGamesPlayedData(): IGame[]
			{
				let data = SpreadsheetApp.getActive().getSheetByName(CONST.pages.extraGames.name).getDataRange().getValues();
				data.shift();
				return data.map(mapping);
			}
		}
	}
}