namespace FrontEnd
{
	export namespace NameUpdate
	{
		export interface IRow
		{
			name: string;
			newName: string;
		}


		function mapping(row: any[]): IRow
		{
			return {
				name: row[CONST.pages.updatePlayer.columns.name],
				newName: row[CONST.pages.updatePlayer.columns.newName],
			};
		}

		export function getData(): IRow[]
		{
			let sheet = SpreadsheetApp.getActive().getSheetByName(CONST.pages.updatePlayer.name).getDataRange().getValues();
			sheet.shift();
			return sheet.filter(r => r[CONST.pages.updatePlayer.columns.name]).map(mapping);
		}


		export function clear()
		{
			SpreadsheetApp.getActive().getSheetByName(CONST.pages.updatePlayer.name).getDataRange().offset(1, 0).clearContent();
		}

		export function hide()
		{
			SpreadsheetApp.getActive().getSheetByName(CONST.pages.updatePlayer.name).hideSheet();
		}

		export function show()
		{
			SpreadsheetApp.getActive().getSheetByName(CONST.pages.updatePlayer.name).showSheet();
		}
	}
}