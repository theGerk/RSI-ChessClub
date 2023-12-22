namespace PostHandling {
	export namespace Checkout {
		export function handle(e: GoogleAppsScript.Events.DoPost) {
			let guids = <string[]>JSON.parse(e.postData.contents);
			FrontEnd.SignoutSheet.signout(Benji.makeSet(guids, x => x));
			return "1";
		}
	}
}