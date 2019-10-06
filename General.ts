/// <reference path="Constants.ts"/>

/** Things that I write that I use everywhere */
namespace Benji
{
	export function getDayString(date: Date)
	{
		return Utilities.formatDate(date, getGMTOffset(date), 'yyyy-MM-dd');
	}

	/**
	 * Formats a number with a specified number of digits by prefixing '0's.
	 * @param num The number to be printed
	 * @param digits The least number of digits to be printed
	 */
	export function formatInteger(num: number, digits: number): string
	{
		let str = num.toString();
		while(str.length < digits)
			str = '0' + str;
		return str;
	}

	/**
	 * get the GMT offset as an object with all 
	 * @param datetime date object to get the offset of, if left blank simply uses local time
	 */
	export function getGMTOffset(datetime?: Date)
	{
		if(!datetime)
			datetime = new Date();
		let offset = datetime.getTimezoneOffset();
		let sign = '-';
		if(offset < 0)
		{
			sign = '+';
			offset *= -1;
		}
		let hour = Math.floor(offset / 60);
		let min = offset % 60;
		return `GMT${sign}${formatInteger(hour, 2)}:${formatInteger(min, 2)}`;
	}

	/**
	 * Gets string version of a date for the Sunday of this week
	 * @param datetime the given time, if left blank uses current time
	 */
	export function getWeekString(): string
	{
		let datetime = new Date();
		let gmtOffsetString = getGMTOffset(datetime);
		let output: string;

		datetime.setDate(datetime.getDate() - datetime.getDay());

		return getDayString(datetime);
	}

	/**
	 * Gets string version of a date
	 * @param datetime the given time
	 */
	export function makeDayStringGMT(datetime?: Date)
	{
		if(!datetime)
			datetime = new Date();
		return Utilities.formatDate(datetime, 'GMT', 'yyyy-MM-dd');
	}

	/**
	 * Makes a deep clone (as opposed to shallow) will break on recursive references.
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

	export function objToArray_dropKey<T>(input: { [key: string]: T }): T[]
	{
		let output: T[] = [];
		for(let key in input)
			output.push(input[key]);
		return output;
	}

	export function objToArray<T>(input: { [key: string]: T }): { key: string, value: T }[]
	{
		let output: { key: string, value: T }[] = [];
		for(let key in input)
			output.push({ key: key, value: input[key] });
		return output;
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