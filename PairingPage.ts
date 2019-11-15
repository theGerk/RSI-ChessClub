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


				let sheet = TemplateSheets.generate(spreadsheet, spreadsheet.getSheetByName(CONST.pages.pairing.template), white.length, CONST.pages.pairing.name, 1);
				sheet.getRange(2, CONST.pages.pairing.columns.whitePlayer + 1, white.length).setValues(white);
				sheet.getRange(2, CONST.pages.pairing.columns.blackPlayer + 1, white.length).setValues(black);
				sheet.autoResizeColumn(CONST.pages.pairing.columns.whitePlayer + 1);
				sheet.autoResizeColumn(CONST.pages.pairing.columns.blackPlayer + 1);
				createPermision(sheet, white.length);

				_cache = [];
				for(let i = 0; i < white.length; i++)
				{
					let row = [];
					row[CONST.pages.pairing.columns.whitePlayer] = white[i];
					row[CONST.pages.pairing.columns.blackPlayer] = black[i];
					_cache.push(row);
				}
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

			var _cache: any[][];


			/** Deletes the pairing page, be careful */
			export function deletePage()
			{
				_cache = null;
				return TemplateSheets.deleteSheet(SpreadsheetApp.getActive(), CONST.pages.pairing.name);
			}

			export function getResults(): IGame[]
			{
				return getData().filter(x => typeof (x.result) === 'number' && x.result >= 0 && x.result <= 1);
			}

			/** Gets the data from pairings page */
			export function getData(): IGame[]
			{
				if(!_cache)
				{
					let sheet = SpreadsheetApp.getActive().getSheetByName(CONST.pages.pairing.name);
					if(sheet === null)
						return [];
					_cache = sheet.getDataRange().getValues();
					_cache.shift();
				}
				return _cache.map(mapping);
			}

			export function modifyNames(nameMap: { [oldName: string]: string })
			{
				let sheet = SpreadsheetApp.getActive().getSheetByName(CONST.pages.pairing.name);
				let data = getData();
				for(let i = data.length - 1; i >= 0; i--)
				{
					let row = data[i];
					if(nameMap.hasOwnProperty(row.white))
					{
						sheet.getRange(i + 2, CONST.pages.pairing.columns.whitePlayer + 1).setValue(nameMap[row.white]);
						_cache[i][CONST.pages.pairing.columns.whitePlayer] = nameMap[row.white];
					}
					if(nameMap.hasOwnProperty(row.black))
					{
						sheet.getRange(i + 2, CONST.pages.pairing.columns.blackPlayer + 1).setValue(nameMap[row.black]);
						_cache[i][CONST.pages.pairing.columns.blackPlayer] = nameMap[row.black];
					}
				}
			}

			export function createPermision(sheet: GoogleAppsScript.Spreadsheet.Sheet, rows: number)
			{
				setPermision(sheet.protect().setUnprotectedRanges([
					sheet.getRange(2, CONST.pages.pairing.columns.blackResult + 1, rows, 1),
					sheet.getRange(2, CONST.pages.pairing.columns.whiteResult + 1, rows, 1)
				]));
			}

			export function setPermision(protection: GoogleAppsScript.Spreadsheet.Protection)
			{
				Permision.setPermisions(protection, p => p.editPlayers || p.pairRounds || p.permision);
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

			var _cache: any[][];


			/** Resets the games played page */
			export function clear()
			{
				let spreadsheet = SpreadsheetApp.getActive();
				let sheet = spreadsheet.getSheetByName(CONST.pages.extraGames.name);
				let range = sheet.getDataRange();
				if(range.getNumRows() > 1)
					range.offset(1, 0).clearContent();
				_cache = [];
			}


			export function setData(games: IGame[])
			{
				clear();

				if(games.length === 0)
					return;

				_cache = games.map(reverseMapping);
				SpreadsheetApp.getActive().getSheetByName(CONST.pages.extraGames.name).getRange(2, 1, _cache.length, _cache[0].length).setValues(_cache);
			}

			/**
			 * Gets all the data stored in the games list as a single array
			 * 
			 * @returns an array of every game played.
			 */
			export function getData(): IGame[]
			{
				if(!_cache)
				{
					_cache = SpreadsheetApp.getActive().getSheetByName(CONST.pages.extraGames.name).getDataRange().getValues();
					_cache.shift();
				}
				return _cache.filter(x => x[CONST.pages.extraGames.columns.result]).map(mapping);
			}


			export function modifyNames(nameMap: { [oldName: string]: string })
			{
				let data = getData();
				for(let i = 0; i < data.length; i++)
				{
					if(data[i].white in nameMap)
						data[i].white = nameMap[data[i].white];
					if(data[i].black in nameMap)
						data[i].black = nameMap[data[i].black];
				}
				setData(data);
			}
		}

		/**
		 * Makes pairings based on given attendance data, then writes the pairings to the page
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

		/** Gets the results of all games played */
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


		/**
		 * Modifies names when names are changed
		 * @param nameMap A name map from old names to new names
		 */
		export function modifyNames(nameMap: { [oldName: string]: string })
		{
			TournamentPairings.modifyNames(nameMap);
			ExtraGames.modifyNames(nameMap);
		}


		export function deletePairing()
		{
			return TournamentPairings.deletePage();
		}



		export function setPermisions()
		{
			let tournamentPairings = SpreadsheetApp.getActive().getSheetByName(CONST.pages.pairing.name);
			if(tournamentPairings)
				TournamentPairings.setPermision(SpreadsheetApp.getActive().getSheetByName(CONST.pages.pairing.name).protect());
		}
	}
}