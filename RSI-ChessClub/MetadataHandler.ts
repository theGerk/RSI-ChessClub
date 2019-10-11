///<reference path="Constants.ts"/>

namespace Benji
{
	export namespace metadata
	{
		/** Maps keys to their developer metadata object */
		export interface IReturn { [key: string]: GoogleAppsScript.Spreadsheet.DeveloperMetadata }

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

		export function getMetadataOnSheet(sheet: GoogleAppsScript.Spreadsheet.Sheet): IReturn
		{
			return getMetaData(sheet.createDeveloperMetadataFinder().withLocationType(SpreadsheetApp.DeveloperMetadataLocationType.SHEET));
		}
	}
}