namespace FrontEnd
{
	export namespace Groups
	{
		/** Represents a group */
		export interface IGroup
		{
			/** The name of the group [Unique ID] */
			name: string;
			/** Weather or not this group's players are paired by default */
			defaultPair: boolean;
		}

		/**
		 * A function that converts a row from the group table and creates a group object
		 * @param row the row from the group table
		 * @returns IGroup representing this row
		 */
		function mapping(row: any[]) : IGroup
		{
			return {
				name: row[CONST.pages.groupTable.columns.name],
				defaultPair: row[CONST.pages.groupTable.columns.pair],
			}
		}

		/**
		 * Gets all data from the group table and returns it as a map from names to group object
		 * @returns map from group name to that group's object
		 */
		export function getData(): { [groupName: string]: IGroup }
		{
			let data = SpreadsheetApp.getActive().getSheetByName(CONST.pages.groupTable.name).getDataRange().getValues();
			data.shift();
			return Benji.makeMap(data.map(mapping), g => g.name);
		}
	}
}