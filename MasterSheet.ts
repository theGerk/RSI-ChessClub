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
			return readSheet(CONST.pages.mainPage.active);
		}

		/**
		 * Get array of ALL players in the club (active and inactive)
		 * @returns array of ALL players
		 */
		export function getAllPlayersArray(): IPlayer[]
		{
			return readSheet(CONST.pages.mainPage.master);
		}

		var _cache: { [sheetName: string]: any[][] } = {};

		/**
		 * Reads a page treating as if its formated like a master sheet.
		 * In practice this is either the Active Players page or the Master Sheet, this may be outdated but any sheet with this format that contains player data.
		 * @param sheet The sheet to be read.
		 * @returns Array of Player objects
		 */
		function readSheet(sheetName: string)
		{
			if(!_cache[sheetName])
			{
				_cache[sheetName] = SpreadsheetApp.getActive().getSheetByName(sheetName).getDataRange().getValues();
				_cache[sheetName].shift();
			}
			return _cache[sheetName].map(mapping);
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
		 */
		function mapping(row: any[])
		{
			return {
				name: row[CONST.pages.mainPage.columns.name],
				rating: {
					rating: row[CONST.pages.mainPage.columns.rating],
					deviation: row[CONST.pages.mainPage.columns.ratingDeviation],
					volatility: row[CONST.pages.mainPage.columns.ratingVolatility],
				},
				active: row[CONST.pages.mainPage.columns.active],
				grade: row[CONST.pages.mainPage.columns.grade],
				pairingHistory: row[CONST.pages.mainPage.columns.tournamentHistory] ? JSON.parse(row[CONST.pages.mainPage.columns.tournamentHistory]) : [],	//TODO maybe make this line more readable
				group: row[CONST.pages.mainPage.columns.group],
				chesskid: row[CONST.pages.mainPage.columns.chesskid],
				gender: row[CONST.pages.mainPage.columns.gender],
				level: row[CONST.pages.mainPage.columns.level],
				teacher: row[CONST.pages.mainPage.columns.teacher],
				gamesPlayed: row[CONST.pages.mainPage.columns.gamesPlayed] || 0,
			};
		}

		/**
		 * Maps a player into a raw row to be written to a sheet
		 * @param row a player object
		 * @returns an array to be written to a sheet
		 */
		function reverseMapping(row: IPlayer): any[]
		{
			let output = [];
			output[CONST.pages.mainPage.columns.grade] = row.grade;
			output[CONST.pages.mainPage.columns.group] = row.group;
			output[CONST.pages.mainPage.columns.name] = row.name;
			output[CONST.pages.mainPage.columns.rating] = (row.rating.rating || row.rating.rating === 0) ? row.rating.rating : '';
			output[CONST.pages.mainPage.columns.ratingDeviation] = (row.rating.deviation || row.rating.deviation === 0) ? row.rating.deviation : '';
			output[CONST.pages.mainPage.columns.ratingVolatility] = (row.rating.volatility || row.rating.volatility === 0) ? row.rating.volatility : '';
			output[CONST.pages.mainPage.columns.tournamentHistory] = JSON.stringify(row.pairingHistory);
			output[CONST.pages.mainPage.columns.chesskid] = row.chesskid;
			output[CONST.pages.mainPage.columns.gender] = row.gender;
			output[CONST.pages.mainPage.columns.level] = row.level;
			output[CONST.pages.mainPage.columns.teacher] = row.teacher;
			output[CONST.pages.mainPage.columns.gamesPlayed] = row.gamesPlayed;
			output[CONST.pages.mainPage.columns.active] = row.active;
			return output;
		}

		/**
		 * Takes an array of player objects and writes them to the correct sheets
		 * @param input array of players to be written
		 */
		function writePlayerArray(input: IPlayer[])
		{
			let ss = SpreadsheetApp.getActive();
			function subWrite(data: any[], sheetName: string)
			{
				let sheet = ss.getSheetByName(sheetName);
				sheet.getDataRange().offset(1, 0).clearContent();
				if(data.length !== 0)
					sheet.getRange(2, 1, data.length, data[0].length).setValues(data);
				_cache[sheetName] = data;
			}
			subWrite(input.filter(x => x.active).map(reverseMapping), CONST.pages.mainPage.active);
			subWrite(input.map(reverseMapping), CONST.pages.mainPage.master);
		}

		/**
		 * Checks to make sure all name changes and new names are valid, ie: no name conflicts. Will throw an error if there is a conflict
		 * @param club a club object
		 * @returns a map from old names to new names for anyone whos name chagnes
		 */
		function validateNameChanges(club: IClub): { [oldName: string]: string }
		{
			/**
			 * Takes a club object and find where names have changed creating a map
			 * @param club a club object
			 * @returns a map from old names to new names for anyone whos name changes
			 */
			function getNameMap(club: IClub): { [oldName: string]: string }
			{
				let nameMap: { [oldName: string]: string } = {};
				for(let name in club)
					if(club[name].name !== name)
						nameMap[name] = club[name].name;
				return nameMap;
			}




			let nameMap = getNameMap(club);

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

			return nameMap;
		}

		/**
		 * Takes a set of name changes and a club and preforms all the required step to make the changes everywhere that it is needed
		 * @param club the club object
		 * @param nameMap a map from old names to new names
		 */
		function modifyNames(club: IClub, nameMap: { [oldName: string]: string })
		{
			//change pair history, do not have to change names as that is how we know what is new
			for(let name in club)
			{
				let player = club[name];

				for(let i = player.pairingHistory.length - 1; i >= 0; i--)
					if(nameMap.hasOwnProperty(player.pairingHistory[i].opponent))
						player.pairingHistory[i].opponent = nameMap[player.pairingHistory[i].opponent];
			}
		}

		/**
		 * takes a club object and writes it to the sheets, handles name changes smartlyish
		 * @param club A club object to get written
		 */
		export function setClub(club: IClub)
		{
			let nameMap = validateNameChanges(club);

			if(Object.keys(nameMap).length !== 0)
			{
				//Modify names
				modifyNames(club, nameMap);
				FrontEnd.Data.modifyNames(nameMap);
				FrontEnd.Games.modifyNames(nameMap);
				FrontEnd.Attendance.modifyNames(nameMap);
			}

			writePlayerArray(Benji.objToArray_dropKey(club));
		}

		export function setPermisions()
		{
			let ss = SpreadsheetApp.getActive();
			let active = ss.getSheetByName(CONST.pages.mainPage.active);
			let master = ss.getSheetByName(CONST.pages.mainPage.master);

			Permision.setPermisions(active.protect(), p => p.editPlayers || p.permision);
			Permision.setPermisions(master.protect(), p => p.editPlayers || p.permision);
		}
	}
}