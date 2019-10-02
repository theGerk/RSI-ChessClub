namespace FrontEnd
{
	export namespace Groups
	{
		export interface IGroup
		{
			name: string;
			pair: boolean;
		}

		function mapping(row: any[]) : IGroup
		{
			return {
				name: row[CONST.pages.groupTable.columns.name],
				pair: row[CONST.pages.groupTable.columns.pair],
			}
		}

		export function get(): { [groupName: string]: IGroup }
		{
			return Benji.makeMap(SpreadsheetApp.getActive().getSheetByName(CONST.pages.groupTable.name).getDataRange().getValues().shift().map(mapping), g=>g.name,);
		}
	}
}