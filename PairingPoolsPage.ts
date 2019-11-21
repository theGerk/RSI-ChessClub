namespace FrontEnd
{
	export namespace PairingPool
	{
		export interface IPairingPool
		{
			name: string;
		}

		function mapping(row: string[]): IPairingPool
		{
			return {
				name: row[CONST.pages.pairingPools.columns.name]
			};
		}

		var _cache: any[][];

		export function getData()
		{
			if (!_cache)
			{
				_cache = SpreadsheetApp.getActive().getSheetByName(CONST.pages.pairingPools.name).getDataRange().getValues();
				_cache.shift();
			}
			return _cache.map(mapping);
		}
	}
}