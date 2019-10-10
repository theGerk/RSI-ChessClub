﻿namespace FrontEnd
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

		namespace TournamentPairings
		{
			/** The result map */
			let resultMap = {
				'W': 1,
				'L': 0,
				'D': .5,
				.5: 'D',
				0: 'L',
				1: 'W',
				'': '',
			}

			/**
			 * Generates the pairings page from a list of pairings
			 * @param pairings
			 */
			export function generate(pairings: Pairings.IPairing[])
			{
				if(pairings.length === 0)
				{
					deletePage();
					return;
				}
				//handle white and black players separately as otherwise equations can get overwritten
				let white: string[][] = [];
				let black: string[][] = [];
				for(let i = pairings.length - 1; i >= 0; i--)
				{
					let current = pairings[i];
					if(current.white !== null && current.black !== null)
					{
						white.push([current.white.name]);
						black.push([current.black.name]);
					}
				}


				//do things to the sheet
				let spreadsheet = SpreadsheetApp.getActive();


				let sheet = TemplateSheets.generate(spreadsheet, spreadsheet.getSheetByName(CONST.pages.pairing.template), pairings.length, CONST.pages.pairing.name, 1);
				sheet.getRange(2, CONST.pages.pairing.columns.whitePlayer + 1, pairings.length).setValues(white);
				sheet.getRange(2, CONST.pages.pairing.columns.blackPlayer + 1, pairings.length).setValues(black);
				sheet.autoResizeColumn(CONST.pages.pairing.columns.whitePlayer + 1);
				sheet.autoResizeColumn(CONST.pages.pairing.columns.blackPlayer + 1);
			}

			/**
			 * Maps a row of data to a IGame
			 * @param row a row from Pairings page
			 */
			function mapping(row: any[]): IGame
			{
				return {
					white: row[CONST.pages.pairing.columns.whitePlayer],
					black: row[CONST.pages.pairing.columns.blackPlayer],
					result: resultMap[row[CONST.pages.pairing.columns.whiteResult]],
				};
			}


			/** Deletes the pairing page, be careful */
			export function deletePage()
			{
				return TemplateSheets.deleteSheet(SpreadsheetApp.getActive(), CONST.pages.pairing.name);
			}

			export function getResults(): IGame[]
			{
				return getData().filter(x => typeof (x.result) === 'number' && x.result >= 0 && x.result <= 1);
			}

			/** Gets the data from pairings page */
			export function getData(): IGame[]
			{
				let sheet = SpreadsheetApp.getActive().getSheetByName(CONST.pages.pairing.name);
				if(sheet === null)
					return [];
				let data = sheet.getDataRange().getValues();
				data.shift();
				return data.map(mapping);
			}

			export function modifyNames(nameMap: { [oldName: string]: string })
			{
				let sheet = SpreadsheetApp.getActive().getSheetByName(CONST.pages.pairing.name);
				let data = getData();
				for(let i = data.length - 1; i >= 0; i--)
				{
					let row = data[i];
					if(nameMap.hasOwnProperty(row.white))
						sheet.getRange(i + 2, CONST.pages.pairing.columns.whitePlayer + 1).setValue(nameMap[row.white]);
					if(nameMap.hasOwnProperty(row.black))
						sheet.getRange(i + 2, CONST.pages.pairing.columns.blackPlayer + 1).setValue(nameMap[row.black]);
				}
			}
		}

		namespace ExtraGames
		{
			/** The result map */
			let resultMap = {
				'Win': 1,
				'Loss': 0,
				'Draw': .5,
				.5: 'Draw',
				0: 'Loss',
				1: 'Win',
				'': '',
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

			function reverseMapping(row: IGame): any[]
			{
				let output = [];
				output[CONST.pages.extraGames.columns.black] = row.black;
				output[CONST.pages.extraGames.columns.white] = row.white;
				output[CONST.pages.extraGames.columns.result] = resultMap[row.result];
				return output;
			}


			/** Resets the games played page */
			export function clear()
			{
				let spreadsheet = SpreadsheetApp.getActive();
				let sheet = spreadsheet.getSheetByName(CONST.pages.extraGames.name);
				let range = sheet.getDataRange();
				if(range.getNumRows() > 1)
					range.offset(1, 0).clearContent();
			}


			export function setData(games: IGame[])
			{
				clear();

				if(games.length === 0)
					return;

				let data = games.map(reverseMapping);
				SpreadsheetApp.getActive().getSheetByName(CONST.pages.extraGames.name).getRange(2, 1, data.length, data[0].length).setValues(data);
			}

			/**
			 * Gets all the data stored in the games list as a single array
			 * 
			 * @returns an array of every game played.
			 */
			export function getData(): IGame[]
			{
				let data = SpreadsheetApp.getActive().getSheetByName(CONST.pages.extraGames.name).getDataRange().getValues();
				data.shift();
				return data.map(mapping);
			}


			export function modifyNames(nameMap: { [oldName: string]: string })
			{
				let data = getData();
			}
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
			let pairings = Pairings.pair(playersToPair);

			TournamentPairings.generate(pairings);
		}

		export function getResults(): { Tournament: IGame[], Other: IGame[] }
		{
			return {
				Tournament: TournamentPairings.getResults(),
				Other: ExtraGames.getData(),
			};
		}

		/** Record the games played in the data file and then clears all active records */
		export function recordAndRemove(): void
		{
			let output = getResults();
			let data = FrontEnd.Data.getData();
			let today = Benji.friday();
			if(!data[today])
				data[today] = FrontEnd.Data.newData(today);
			data[today].games = output;
			FrontEnd.Data.writeData(data);
			ExtraGames.clear();
			TournamentPairings.deletePage();
		}


		export function modifyNames(nameMap: { [oldName: string]: string })
		{
			TournamentPairings.modifyNames(nameMap);
			ExtraGames.modifyNames(nameMap);
		}
	}
}