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
			hasAttendance: boolean;
			pairingPool: string;
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
				hasAttendance: row[CONST.pages.groupTable.columns.generate_attendance_sheet],
				room: row[CONST.pages.groupTable.columns.room],
				pairingPool: row[CONST.pages.groupTable.columns.defaultPairingPool],
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

		export function setPermisions()
		{
			Permision.setPermisions(SpreadsheetApp.getActive().getSheetByName(CONST.pages.groupTable.name).protect(), p => p.groups || p.permision);
		}
	}
}