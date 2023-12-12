///<reference path="Constants.ts"/>

namespace Benji
{
	export namespace Metadata
	{
		/** Maps keys to their developer metadata object */
		export interface IReturn { [key: string]: GoogleAppsScript.Spreadsheet.DeveloperMetadata }

		/**
		 * Gets the metadata as a map from keys to the metadata
		 * @param finder
		 */
		export function getMetaData(finder: GoogleAppsScript.Spreadsheet.DeveloperMetadataFinder): IReturn
		{
			let arr = finder.find();
			let obj: IReturn = {};
			for(var i = 0; i < arr.length; i++)
			{
				let val = arr[i];
				let key = val.getKey();
				if(obj.hasOwnProperty(key))
					throw new Error(`Duplicate key (${key}) found on finder: ${finder}.`);
				else
					obj[key] = val;
			}
			return obj;
		}


		/**
		 * Gets all metadata that is on a sheet, not incuding metadata in the sheet.
		 * @param sheet The sheet who's metadata we are retriving
		 */
		export function getMetadataOnSheet(sheet: GoogleAppsScript.Spreadsheet.Sheet): IReturn
		{
			return getMetaData(sheet.createDeveloperMetadataFinder().withLocationType(SpreadsheetApp.DeveloperMetadataLocationType.SHEET));
		}
	}
}