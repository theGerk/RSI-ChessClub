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
			room: string;
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
				room: row[CONST.pages.groupTable.columns.room],
			}
		}

		/** Holds all data from the page except the header row in a raw format */
		var _cache: any[][];

		/**
		 * Gets all data from the group table and returns it as a map from names to group object
		 * @returns map from group name to that group's object
		 */
		export function getData(): { [groupName: string]: IGroup }
		{
			if(!_cache)
			{
				_cache = SpreadsheetApp.getActive().getSheetByName(CONST.pages.groupTable.name).getDataRange().getValues();
				_cache.shift();
			}
			return Benji.makeMap(_cache.map(mapping), g => g.name);
		}
	}
}