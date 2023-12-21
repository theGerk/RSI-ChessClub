namespace PostHandling {
	interface IPostArgs {
		/** A string specifier for which endpoint to use. Should be short as it goes in the URL. Also must be a string that can be put in a URL obviously. */
		endpoint: string;
	}

	const endpointHandlers: { [endpoint: string]: (e: GoogleAppsScript.Events.DoPost) => string } = {
		checkin: PostHandling.Checkin.handle,
		checkout: PostHandling.Checkout.handle,
	}

	export function dispatch(request: GoogleAppsScript.Events.DoPost) {
		let args = <IPostArgs>request.parameter;
		if (!args.endpoint)
			throw new Error("No endpoint specified.");

		let handler = endpointHandlers[args.endpoint];
		if (!handler)
			throw new Error(`No handler for endpoint "${args.endpoint}".`);

		return handler(request);
	}
}

namespace GetHandling {
	interface IGetArgs {
		/** A string specifier for which endpoint to use. Should be short as it goes in the URL. Also must be a string that can be put in a URL obviously. */
		endpoint: string;
	}

	const endpointHandlers: { [endpoint: string]: (e: GoogleAppsScript.Events.DoGet) => string } = {
		checkinAttendancesStatus: e => {
			let data = FrontEnd.Attendance.getAllAttendanceData();
			let output: { Name: string, Id: string, SignedIn: boolean }[] = [];
			for (let name in data) {
				let person = data[name];
				output.push({
					Name: name,
					Id: person.guid,
					SignedIn: person.attending,
				});
			}
			return JSON.stringify(output);
		},
	}

	export function dispatch(request: GoogleAppsScript.Events.DoGet) {
		let args = <IGetArgs>request.parameter;
		if (!args.endpoint)
			throw new Error("No endpoint specified.");

		let handler = endpointHandlers[args.endpoint];
		if (!handler)
			throw new Error(`No handler for endpoint "${args.endpoint}".`);

		return handler(request);
	}
}