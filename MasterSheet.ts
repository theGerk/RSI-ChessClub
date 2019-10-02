namespace FrontEnd
{
	export namespace Master
	{
		/**
		 * Creates the groups object, a mapping from group names to an array of all the people in them
		 * 
		 * @returns groups object, 
		 */
		export function getGroupsObject()
		{

			//create object mapping group name to array of group members
			let groups: { [groupName: string]: IPlayer[] } = {};

			let players = getActivePlayersArray();
			for(var i = players.length - 1; i >= 0; i--)
			{
				let player = players[i];
				if(groups.hasOwnProperty(player.group))
					groups[player.group].push(player);
				else
					groups[player.group] = [player];
			}

			return groups;
		}

		/** 
		 * Get array of all active players
		 * @returns array of all active players
		 */
		export function getActivePlayersArray(): IPlayer[]
		{
			return getPlayerArray(true);
		}

		/**
		 * Get array of ALL players in the club (active and inactive)
		 * @returns array of ALL players
		 */
		export function getAllPlayersArray(): IPlayer[]
		{
			return getPlayerArray(true).concat(getPlayerArray(false));
		}

		/**
		 * Get club object representing entire club (active and inactive)
		 * @returns Club object
		 */
		export function getClub(): IClub
		{
			try
			{
				return Benji.makeMap(getAllPlayersArray(), p => p.name);
			} catch(er)
			{
				throw new Error(`Error in creating club object.
${er}`);
			}
		}

		/**
		 * Takes in a row from master table and returns an IPlayer
		 * @param row the row coming in
		 * @param active Is the player active [defaults to undefined]
		 */
		function mapping(row: any[], active?: boolean): IPlayer
		{
			return {
				name: row[CONST.pages.mainPage.columns.name],
				rating: {
					rating: row[CONST.pages.mainPage.columns.rating],
					deviation: row[CONST.pages.mainPage.columns.ratingDeviation],
					volatility: row[CONST.pages.mainPage.columns.ratingVolatility],
				},
				active: active,
				grade: row[CONST.pages.mainPage.columns.grade],
				pairingHistory: row[CONST.pages.mainPage.columns.tournamentHistory] ? JSON.parse(row[CONST.pages.mainPage.columns.tournamentHistory]) : {},	//TODO maybe make this line more readable
				group: row[CONST.pages.mainPage.columns.group],
			};
		}

		/**
		 * Gets array of all players that are either active or inactive
		 * @param active true => active players, false => inactive players
		 * @returns array of players
		 */
		function getPlayerArray(active: boolean): IPlayer[]
		{
			let sheet = SpreadsheetApp.getActive().getSheetByName(active ? CONST.pages.mainPage.name : CONST.pages.mainPage.storage);
			let data = sheet.getDataRange().getValues();
			data.shift();
			return data.map((row) => mapping(row, active));
		}

		export function updateNames(nameMap: { [oldName: string]: string })
		{
			let club = getClub();


			//do checks to make sure everything is okay
			//a new name can only appear in the club if it is being changed
			let newNameSet: { [newName: string]: boolean } = {};

			for(let oldName in nameMap)
			{
				let newName = nameMap[oldName];
				if(newNameSet[newName])
					throw new Error(`Invalid name error: at least two people are changing their name to ${newName}.`);
				else
					newNameSet[newName] = true;

				if(club.hasOwnProperty(newName))
					throw new Error(`Invalid name error: the name "${newName}" already exists in the club, "${oldName}" can to be changed.`)
			}


			//TODO fill in all the places where names are used as a UID
			//Master list

			//Attendance

			//Games Log

			//Other things TODO TODO
		}
	}
}