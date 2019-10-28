namespace FrontEnd
{
	export namespace Users
	{
		export interface User
		{
			email: string;
		}

		export function mapping(row: any[]): User
		{
			return {
				email: row[CONST.pages.permisions.columns.email],
			};
		}

		export function getUsers()
		{
			let range = SpreadsheetApp.getActive().getSheetByName(CONST.pages.permisions.name).getDataRange().getValues();
			range.shift();
			range.filter(x => x[CONST.pages.permisions.name]).map(mapping);
		}
	}
}