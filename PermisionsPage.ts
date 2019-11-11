namespace FrontEnd
{
	export namespace PermisionPage
	{
		export interface IUser
		{
			name: string;
			email: string;
			permisions: Permision.IPermision;
		}

		function mapping(row: any[]): IUser
		{
			return {
				name: row[CONST.pages.permisions.columns.humanName],
				email: row[CONST.pages.permisions.columns.email],
				permisions: {
					permision: row[CONST.pages.permisions.columns.permision_permsionSetting],
					editPlayers: row[CONST.pages.permisions.columns.permision_playerEditing],
					pairRounds: row[CONST.pages.permisions.columns.permision_roundPairing],
					groups: row[CONST.pages.permisions.columns.permision_editingGroupPage],
				},
			};
		}

		function reverseMapping(data: IUser)
		{
			let output = [];
			output[CONST.pages.permisions.columns.humanName] = data.name;
			output[CONST.pages.permisions.columns.email] = data.email;
			output[CONST.pages.permisions.columns.permision_editingGroupPage] = data.permisions.groups;
			output[CONST.pages.permisions.columns.permision_permsionSetting] = data.permisions.permision;
			output[CONST.pages.permisions.columns.permision_playerEditing] = data.permisions.editPlayers;
			output[CONST.pages.permisions.columns.permision_roundPairing] = data.permisions.pairRounds;
			return output;
		}

		function setData(userPermisions: IUser[])
		{
			let raw = userPermisions.map(reverseMapping);
			let sheet = SpreadsheetApp.getActive().getSheetByName(CONST.pages.permisions.name);
			sheet.getDataRange().offset(1, 0).clearContent();
			if(raw.length > 0)
			{
				sheet.getRange(2, 1, raw.length, raw[0].length).setValues(raw);
				_cache = raw;
			}
		}

		export function normalizeEmails()
		{
			let data = getData();
			let users = Benji.makeMap(SpreadsheetApp.getActive().getEditors().map(u => u.getEmail()), email => email.toLowerCase());
			for(var i = data.length - 1; i >= 0; i--)
			{
				let me = data[i];
				let correct = users[me.email.toLowerCase()];
				if(correct)
					me.email = correct;
			}
			setData(data);
		}

		/** Contains all raw data with only the header row removed */
		var _cache: any[][];

		function getData()
		{
			if(!_cache)
			{
				_cache = SpreadsheetApp.getActive().getSheetByName(CONST.pages.permisions.name).getDataRange().getValues();
				_cache.shift();
			}
			return _cache.filter(x => x[CONST.pages.permisions.name]).map(mapping);
		}

		export function getPermisions()
		{
			return Benji.makeMap(getData(), user => user.email, true);
		}
	}
}