namespace FrontEnd
{
	export namespace Groups
	{
		export interface IGroup
		{
			name: string;
			defaultPair: boolean;
		}

		function mapping(row: any[]) : IGroup
		{
			return {
				name: row[CONST.pages.groupTable.columns.name],
				defaultPair: row[CONST.pages.groupTable.columns.pair],
			}
		}

		export function getData(): { [groupName: string]: IGroup }
		{
			let data = SpreadsheetApp.getActive().getSheetByName(CONST.pages.groupTable.name).getDataRange().getValues();
			data.shift();
			return Benji.makeMap(data.map(mapping), g => g.name);
		}
	}
}