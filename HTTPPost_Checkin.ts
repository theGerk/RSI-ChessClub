namespace PostHandling {
	export namespace Checkin {
		export function handle(e: GoogleAppsScript.Events.DoPost) {
			let guids = <string[]>JSON.parse(e.postData.contents);
			for (var i = guids.length - 1; i >= 0; i--) {
				FrontEnd.Attendance.checkin(guids[i]);
			}
			return "1";
		}
	}
}