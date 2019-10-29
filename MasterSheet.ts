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
		function mapping(active: boolean): (row: any[]) => IPlayer
		{
			return function(row: any[])
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
					pairingHistory: row[CONST.pages.mainPage.columns.tournamentHistory] ? JSON.parse(row[CONST.pages.mainPage.columns.tournamentHistory]) : [],	//TODO maybe make this line more readable
					group: row[CONST.pages.mainPage.columns.group],
					chesskid: row[CONST.pages.mainPage.columns.chesskid],
					gender: row[CONST.pages.mainPage.columns.gender],
					level: row[CONST.pages.mainPage.columns.level],
					teacher: row[CONST.pages.mainPage.columns.teacher],
					gamesPlayed: row[CONST.pages.mainPage.columns.gamesPlayed] || 0,
				};
			};
		}

		function reverseMapping(row: IPlayer): any[]
		{
			let output = [];
			output[CONST.pages.mainPage.columns.grade] = row.grade;
			output[CONST.pages.mainPage.columns.group] = row.group;
			output[CONST.pages.mainPage.columns.name] = row.name;
			output[CONST.pages.mainPage.columns.rating] = row.rating.rating;
			output[CONST.pages.mainPage.columns.ratingDeviation] = row.rating.deviation;
			output[CONST.pages.mainPage.columns.ratingVolatility] = row.rating.volatility;
			output[CONST.pages.mainPage.columns.tournamentHistory] = JSON.stringify(row.pairingHistory);
			output[CONST.pages.mainPage.columns.chesskid] = row.chesskid;
			output[CONST.pages.mainPage.columns.gender] = row.gender;
			output[CONST.pages.mainPage.columns.level] = row.level;
			output[CONST.pages.mainPage.columns.teacher] = row.teacher;
			output[CONST.pages.mainPage.columns.gamesPlayed] = row.gamesPlayed;
			return output;
		}

		function getSheet(active: boolean) { return SpreadsheetApp.getActive().getSheetByName(active ? CONST.pages.mainPage.name : CONST.pages.mainPage.storage); }

		/**
		 * Gets array of all players that are either active or inactive
		 * @param active true => active players, false => inactive players
		 * @returns array of players
		 */
		function getPlayerArray(active: boolean): IPlayer[]
		{
			let sheet = getSheet(active);
			let data = sheet.getDataRange().getValues();
			data.shift();
			return data.map(mapping(active)).filter(player => player.name !== '');	//only include rows with a name
		}

		function writePlayerArray(input: IPlayer[], active: boolean)
		{
			let sheet = getSheet(active);
			let raw = input.map(reverseMapping);
			sheet.getDataRange().offset(1, 0).clearContent();
			if(input.length !== 0)
				sheet.getRange(2, 1, raw.length, raw[0].length).setValues(raw);
		}

		function getNameMap(club: IClub): { [oldName: string]: string }
		{
			let nameMap: { [oldName: string]: string } = {};
			for(let name in club)
				if(club[name].name !== name)
					nameMap[club[name].name] = name;
			return nameMap;
		}

		function validateNameChanges(club: IClub): { [oldName: string]: string }
		{
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

		function modifyNames(club: IClub, nameMap: { [oldName: string]: string})
		{
			//change pair history, do not have to change names as that is how we know what is new
			for(let name in club)
			{
				let player = club[name];

				for(let i = player.pairingHistory.length; i >= 0; i--)
					if(nameMap.hasOwnProperty(player.pairingHistory[i].opponent))
						player.pairingHistory[i].opponent = nameMap[player.pairingHistory[i].opponent];
			}
		}

		export function setClub(club: IClub)
		{
			let nameMap = validateNameChanges(club);

			if(Object.keys(nameMap).length !== 0)
			{
				//Modify names
				modifyNames(club, nameMap);
				FrontEnd.Data.modifyNames(nameMap);
				FrontEnd.Attendance.modifyNames(nameMap);
				FrontEnd.Games.modifyNames(nameMap);
			}

			let active: IPlayer[] = [];
			let inactive: IPlayer[] = [];
			for(let name in club)
			{
				let player = club[name]
				if(player.active)
					active.push(player);
				else
					inactive.push(player);
			}

			writePlayerArray(active, true);
			writePlayerArray(inactive, false);
		}
	}
}