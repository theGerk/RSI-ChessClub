namespace Permision
{
	export interface IPermision
	{
		permision: boolean;
		editPlayers: boolean;
		pairRounds: boolean;
		groups: boolean;
	}

	export function doIHavePermsion(permisionValidator: (permision: IPermision) => boolean)
	{
		let user = Session.getActiveUser().getEmail();
		let permisions = FrontEnd.PermisionPage.getPermisions_map();
		let me = permisions[user];

		//I HAVE ALL THE POWER!
		//needed for time based triggers that I create.
		if(user.toLowerCase() === 'benji@altmansoftwaredesign.com')
			return true;

		if(!me)
			return false;

		return permisionValidator(me.permisions);
	}

	export function validatePermision(permisionValidator: (permision: IPermision) => boolean)
	{
		if(doIHavePermsion(permisionValidator) == false)
			throw new Error("You do not have permision to do this.");
	}

	export function setPermisions(protection: GoogleAppsScript.Spreadsheet.Protection, permisionValidator: (permision: IPermision) => boolean)
	{
		let include: string[] = [];
		let exclude: string[] = [];
		let users = FrontEnd.PermisionPage.getPermisions_array();
		for(let i = users.length - 1; i >= 0; i--)
			if(permisionValidator(users[i].permisions))
				include.push(users[i].email);
			else
				exclude.push(users[i].email);
		protection.addEditors(include).removeEditors(exclude);
	}
}