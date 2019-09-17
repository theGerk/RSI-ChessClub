namespace FrontEnd
{
	/**
	 * Creats the groups object, a mapping from group names to an array of all the people in them
	 * 
	 * @returns groups object, 
	 */
	export function getGroupsObject()
	{
		let spreadsheet = SpreadsheetApp.getActive();
		let data = spreadsheet.getSheetByName(CONST.pages.mainPage.name).getDataRange().getValues();


		//create object maping group name to array of group members
		let groups: { [groupName: string]: IPlayer[] } = {};
		for(let i = 1; i < data.length; i++)
		{
			let group = data[i][CONST.pages.mainPage.columns.group].toLowerCase();

			//may need to be edited when IPerson is edited
			let person: IPlayer = {
				name: data[i][CONST.pages.mainPage.columns.name],
				rating: {
					rating: data[i][CONST.pages.mainPage.columns.rating],
					deviation: data[i][CONST.pages.mainPage.columns.ratingDeviation],
					volatility: data[i][CONST.pages.mainPage.columns.ratingVolatility]
				},
				grade: data[i][CONST.pages.mainPage.columns.grade],
				group: data[i][CONST.pages.mainPage.columns.group],
				active: true,
			};

			if(group in groups)
				groups[group].push(person);
			else
				groups[group] = [person];
		}

		return groups;
	}

	export function getActivePlayersArray(): IPlayer[]
	{
		return getPlayerArray(true);
	}

	export function getAllPlayersArray(): IPlayer[]
	{
		return getPlayerArray(true).concat(getPlayerArray(false));
	}

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
			};
			return ret;
		});
	}
}