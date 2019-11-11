namespace Permision
{
	export interface IPermision
	{
		permision: boolean;
		editPlayers: boolean;
		pairRounds: boolean;
		groups: boolean;
	}


	//TODO finish dynamic page permsions
	/** WORK IN PROGESS */
	export function setPagePermisions()
	{
		let users = FrontEnd.PermisionPage.getPermisions();

		//Set all page permisions
	}

	export function doIHavePermsion(permisionValidator: (permision: IPermision) => boolean)
	{
		let user = Session.getActiveUser().getEmail();
		let permisions = FrontEnd.PermisionPage.getPermisions();
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

	export function updatePagePermisions()
	{
		let permisions = FrontEnd.PermisionPage.getPermisions();

	}
}