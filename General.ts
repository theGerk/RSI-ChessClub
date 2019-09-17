/// <reference path="Constants.ts"/>

/** Things that I write that I use everywhere */
namespace Benji
{
	/**
	 * Makes a deep clone (as opposed to shalow) will break on recursive references.
	 * @param input variable to be deep cloned
	 */
	export function deepClone(input: any): any
	{
		//TODO make this better by not doing the whole JSON thing.
		return JSON.parse(JSON.stringify(input));
	}

	export function makeMap<T>(input: T[], getKey: (input: T) => string): { [key: string]: T }
	{
		let output: { [key: string]: T } = {};
		for(let i = 0; i < input.length; i++)
		{
			let val = input[i];
			let key = getKey(val);
			if(output.hasOwnProperty(key))
				throw new Error(`Array ${input.toString()} has a duplicate value at ${i}.`);
			output[key] = val;
		}
		return output;
	}
}