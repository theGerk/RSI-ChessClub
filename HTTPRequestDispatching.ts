namespace PostHandling {
	interface IPostArgs {
		/** A string specifier for which endpoint to use. Should be short as it goes in the URL. Also must be a string that can be put in a URL obviously. */
		endpoint: string;
	}

	const endpointHandlers: { [endpoint: string]: (e: GoogleAppsScript.Events.DoPost) => string } = {
		"checkin": PostHandling.Checkin.handle,
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