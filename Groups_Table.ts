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
			return Benji.makeMap(SpreadsheetApp.getActive().getSheetByName(CONST.pages.groupTable.name).getDataRange().getValues().shift().map(mapping), g=>g.name,);
		}
	}
}