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

		export interface IRound
		{
			Games: IGame[];
			Byes: string[];
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
			export function generate(pairings: Pairings.IPairing[], poolName: string)
			{
				if(pairings.length === 0)
				{
					removePairingSheets();
					return;
				}
				//handle white and black players separately as otherwise formulas on the Google Sheet can get overwritten
				let white: string[][] = [];
				let black: string[][] = [];
				for(let i = pairings.length - 1; i >= 0; i--)
				{
					let current = pairings[i];
					if(current.white !== null)
					{
						white.push([current.white.name]);

						if(current.black !== null)
							black.push([current.black.name]);
						else
							black.push([CONST.pages.pairing.byeString]);
					}
					else if(current.black !== null)
					{
						white.push([current.black.name]);
						black.push([CONST.pages.pairing.byeString]);
					}
				}


				//do things to the sheet
				let spreadsheet = SpreadsheetApp.getActive();

				//populate data
				let sheet = TemplateSheets.generate(spreadsheet, spreadsheet.getSheetByName(CONST.pages.pairing.template), white.length, `Tournament for ${poolName}`, 0);
				sheet.getRange(2, CONST.pages.pairing.columns.whitePlayer + 1, white.length).setValues(white);
				sheet.getRange(2, CONST.pages.pairing.columns.blackPlayer + 1, white.length).setValues(black);
				sheet.autoResizeColumn(CONST.pages.pairing.columns.whitePlayer + 1);
				sheet.autoResizeColumn(CONST.pages.pairing.columns.blackPlayer + 1);

				//generate permissions
				createPermision(sheet, white.length);

				//add metadata
				sheet.addDeveloperMetadata(CONST.pages.pairing.metadata.key, SpreadsheetApp.DeveloperMetadataVisibility.PROJECT);
				sheet.addDeveloperMetadata(CONST.pages.pairing.metadata.pool, poolName, SpreadsheetApp.DeveloperMetadataVisibility.PROJECT);

				//update cache
				_cache[poolName] = [];
				for(let i = 0; i < white.length; i++)
				{
					let row = [];
					row[CONST.pages.pairing.columns.whitePlayer] = white[i];
					row[CONST.pages.pairing.columns.blackPlayer] = black[i];
					_cache[poolName].push(row);
				}
			}

			/**
			 * Gets metadata from a pairing sheet, will return null if it is not a pairing sheet.
			 * This is the accepted way to determine if a sheet is a pairing sheet.
			 * @param sheet The sheet in question
			 * @returns the metadata on the sheet as an map from key to metadata objects if this is a pairing sheet, otherwise returns null
			 */
			function getPairingSheetMetadata(sheet: GoogleAppsScript.Spreadsheet.Sheet): Benji.metadata.IReturn
			{
				let metadata = Benji.metadata.getMetadataOnSheet(sheet);
				if(metadata.hasOwnProperty(CONST.pages.pairing.metadata.key))
					return metadata;
				else
					return null;
			}

			function getSheets()
			{
				return SpreadsheetApp.getActive().getSheets().filter(getPairingSheetMetadata);
			}

			/**
			 * Maps a row of data to an IGame
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

			var _cache: { [pairingPool: string]: any[][] } = {};


			/**
			 * Be careful, this destroys all pairings without any recovery method. It removes all attendance sheets, or a single sheet for a given pairing pool.
			 * @param pairingPool the name of the pairing pool to be deleted, left undefined to delete all sheets
			 */
			export function removePairingSheets(pairingPool?: string)
			{
				let spreadsheet = SpreadsheetApp.getActive();
				let sheets = getSheets();

				//go ahead and delete some sheets
				for(let i = sheets.length - 1; i >= 0; i--)
				{
					let metadata = getPairingSheetMetadata(sheets[i]);
					if(metadata !== null)
					{
						let pool = metadata[CONST.pages.pairing.metadata.pool].getValue();
						if(!pairingPool || pool === pairingPool)
						{
							spreadsheet.deleteSheet(sheets[i]);
							delete _cache[pool];
						}
					}
				}
			}

			export function getResults(): IRound
			{
				let output = processToRound(getData());
				output.Games = output.Games.filter(x => typeof (x.result) === 'number' && x.result >= 0 && x.result <= 1);
				return output;
			}


			function getPageData(sheet: GoogleAppsScript.Spreadsheet.Sheet): { data: IGame[], pool: string }
			{
				let metadata = getPairingSheetMetadata(sheet);

				if(metadata === null)
					return null;

				let poolName = metadata[CONST.pages.pairing.metadata.pool].getValue();

				if(!_cache[poolName])
				{
					_cache[poolName] = sheet.getDataRange().getValues();
					_cache[poolName].shift();
				}

				let outputData = _cache[poolName].map(mapping);


				return {
					data: outputData,
					pool: poolName
				};
			}

			/**
			 * Turns a game array into an IRound (separates out byes)
			 * @param outputData array of IGames that may contain byes.
			 */
			function processToRound(outputData: IGame[]): IRound
			{
				let games: IGame[] = [];
				let byes: string[] = [];

				outputData.forEach((g) =>
				{
					if(g.white === CONST.pages.pairing.byeString)
						if(g.black === CONST.pages.pairing.byeString)
							return;
						else
							byes.push(g.black);
					else
						if(g.black === CONST.pages.pairing.byeString)
							byes.push(g.white);
						else
							games.push(g);
				});

				return {
					Games: games,
					Byes: byes
				};
			}


			/** Gets the data from all pairings */
			export function getData(): IGame[]
			{
				let output: IGame[] = [];
				let sheets = SpreadsheetApp.getActive().getSheets();
				for(let i = sheets.length - 1; i >= 0; i--)
				{
					let tmp = getPageData(sheets[i]);
					if(tmp !== null)
					{
						output.push(...tmp.data);
					}
				}

				return output;
			}

			export function modifyNames(nameMap: { [oldName: string]: string })
			{
				let sheets = getSheets();
				for(let j = sheets.length - 1; j >= 0; j--)
				{
					let sheet = sheets[j];
					let cache = _cache[Benji.metadata.getMetadataOnSheet(sheet)[CONST.pages.pairing.metadata.pool].getValue()];
					let data = getData();
					for(let i = data.length - 1; i >= 0; i--)
					{
						let row = data[i];
						if(nameMap.hasOwnProperty(row.white))
						{
							sheet.getRange(i + 2, CONST.pages.pairing.columns.whitePlayer + 1).setValue(nameMap[row.white]);
							cache[i][CONST.pages.pairing.columns.whitePlayer] = nameMap[row.white];
						}
						if(nameMap.hasOwnProperty(row.black))
						{
							sheet.getRange(i + 2, CONST.pages.pairing.columns.blackPlayer + 1).setValue(nameMap[row.black]);
							cache[i][CONST.pages.pairing.columns.blackPlayer] = nameMap[row.black];
						}
					}
				}
			}

			export function createPermision(sheet: GoogleAppsScript.Spreadsheet.Sheet, rows: number)
			{
				setPermision(sheet.protect().setUnprotectedRanges([
					sheet.getRange(2, CONST.pages.pairing.columns.blackResult + 1, rows, 1),
					sheet.getRange(2, CONST.pages.pairing.columns.whiteResult + 1, rows, 1),
				]));
			}

			export function setPermisions()
			{
				let sheets = getSheets();
				for(let i = sheets.length - 1; i >= 0; i--)
					setPermision(sheets[i].protect());
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

			let pools: { [poolName: string]: IPlayer[] } = {};

			//get array of players to be paired
			for(let player in attendance)
			{
				let current = attendance[player];
				if(current.attending && current.pair && current.pairingPool)
				{
					let pool = pools[current.pairingPool]
					if(pool)
						pool.push(club[current.name]);
					else
						pools[current.pairingPool] = [club[current.name]];
				}
			}

			//pair everyone
			for(let poolName in pools)
			{
				let pool = pools[poolName];
				TournamentPairings.generate(Pairings.pair(pool), poolName);
			}
		}

		/** Gets the results of all games played */
		export function getResults(): { Tournament: IRound, Other: IGame[] }
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
			TournamentPairings.removePairingSheets();
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
			return TournamentPairings.removePairingSheets();
		}



		export function setPermisions()
		{
			TournamentPairings.setPermisions();
		}
	}
}