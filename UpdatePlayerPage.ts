namespace FrontEnd
{
	export namespace NameUpdate
	{
		/** A player update datum */
		export interface IPlayerUpdate
		{
			name: string;
			newName: string;
			group: string;
			grade: string | number;
			teacher: string;
			level: string;
			gender: string;
			chessKid: string;
			active: boolean;
		}

		/**
		 * Maps from a raw row of data about a player update to a player update object
		 * @param row raw data refering to a player update
		 */
		function mapping(row: any[]): IPlayerUpdate
		{
			return {
				name: row[CONST.pages.updatePlayer.columns.name],
				newName: row[CONST.pages.updatePlayer.columns.newName],
				grade: row[CONST.pages.updatePlayer.columns.grade],
				group: row[CONST.pages.updatePlayer.columns.group],
				teacher: row[CONST.pages.updatePlayer.columns.teacher],
				level: row[CONST.pages.updatePlayer.columns.level],
				gender: row[CONST.pages.updatePlayer.columns.gender],
				chessKid: row[CONST.pages.updatePlayer.columns.chessKid],
				active: row[CONST.pages.updatePlayer.columns.active]
			};
		}

		/** Gets all data currently on the player update page */
		export function getData(): IPlayerUpdate[]
		{
			let sheet = SpreadsheetApp.getActive().getSheetByName(CONST.pages.updatePlayer.name).getDataRange().getValues();
			sheet.shift();
			let output = sheet.filter(r => r[CONST.pages.updatePlayer.columns.name]).map(mapping);
			for(var i = output.length - 1; i >= 0; i--)
				if(!output[i].group)
					throw new Error(`On row ${i + 2} of ${CONST.pages.updatePlayer.name} the entry does not have a group.`);
			return output;
		}

		/** Removes the player update page */
		export function remove()
		{
			TemplateSheets.deleteSheet(SpreadsheetApp.getActive(), CONST.pages.updatePlayer.name);
		}

		/** Makes a clean player update page */
		export function make()
		{
			let ss = SpreadsheetApp.getActive();
			TemplateSheets.generate(ss, ss.getSheetByName(CONST.pages.updatePlayer.template), 100, CONST.pages.updatePlayer.name);
		}
	}
}