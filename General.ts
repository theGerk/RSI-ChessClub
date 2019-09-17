/// <reference path="Constants.ts"/>

/** Things that I write that I use everywhere */
namespace Benji
{
	/**
	 * Makes a deep clone (as opposed to shalow) will break on recursive references.
	 * @param input variable to be deep cloned
	 */
	export function deepClone<T>(input: T): T
	{
		//TODO make this better by not doing the whole JSON thing.
		return JSON.parse(JSON.stringify(input));
	}

	export function shalowCloneArray<T>(input: T[]): T[]
	{
		return [...input];
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


	/**
	 * Shuffles array in place.
	 * @param array An array containing the items.
	 */
	export function shuffle<T>(array: T[]): T[]
	{
		var j, x, i;
		for(i = array.length - 1; i > 0; i--)
		{
			j = Math.floor(Math.random() * (i + 1));
			x = array[i];
			array[i] = array[j];
			array[j] = x;
		}
		return array;
	}
}