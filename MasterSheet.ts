namespace FrontEnd
{
	export namespace Master
	{
		/**
		 * Creats the groups object, a mapping from group names to an array of all the people in them
		 * 
		 * @returns groups object, 
		 */
		export function getGroupsObject()
		{

			//create object maping group name to array of group members
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
		 * Gets array of all players that are either active or inactive
		 * @param active true => active players, false => inactive players
		 * @returns array of players
		 */
		function getPlayerArray(active: boolean): IPlayer[]
		{
			let sheet = SpreadsheetApp.getActive().getSheetByName(active ? CONST.pages.mainPage.name : CONST.pages.mainPage.storage);
			let data = sheet.getDataRange().getValues().shift();
			return data.map(row =>
			{
				let ret: IPlayer = {
					name: row[CONST.pages.mainPage.columns.name],
					rating: {
						rating: row[CONST.pages.mainPage.columns.rating],
						deviation: row[CONST.pages.mainPage.columns.ratingDeviation],
						volatility: row[CONST.pages.mainPage.columns.ratingVolatility],
					},
					active: active,
					grade: row[CONST.pages.mainPage.columns.grade],
					group: row[CONST.pages.mainPage.columns.group],
					pairingHistory: JSON.parse(row[CONST.pages.mainPage.columns.tournamentHistory]),
				};
				return ret;
			});
		}
	}

	/**
	 * Gets the club object, representing entire club
	 * @returns club object
	 */
	export var getClub = Master.getClub;
}