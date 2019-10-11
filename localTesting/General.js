/// <reference path="Constants.ts"/>
/** Things that I write that I use everywhere */
var Benji;
(function (Benji) {
    //export function getDayString(date: Date)
    //{
    //	return Utilities.formatDate(date, getGMTOffset(date), 'yyyy-MM-dd');
    //}
    /**
     * Formats a number with a specified number of digits by prefixing '0's.
     * @param num The number to be printed
     * @param digits The least number of digits to be printed
     */
    function formatInteger(num, digits) {
        let str = num.toString();
        while (str.length < digits)
            str = '0' + str;
        return str;
    }
    Benji.formatInteger = formatInteger;
    /**
     * get the GMT offset as an object with all
     * @param datetime date object to get the offset of, if left blank simply uses local time
     */
    function getGMTOffset(datetime) {
        if (!datetime)
            datetime = new Date();
        let offset = datetime.getTimezoneOffset();
        let sign = '-';
        if (offset < 0) {
            sign = '+';
            offset *= -1;
        }
        let hour = Math.floor(offset / 60);
        let min = offset % 60;
        return `GMT${sign}${formatInteger(hour, 2)}:${formatInteger(min, 2)}`;
    }
    Benji.getGMTOffset = getGMTOffset;
    /**
     * Gets string version of a date for the Sunday of this week
     * @param day An integer [0, 6] for which day of the week to use.
     */
    //export function getWeekString(day?: number): string
    //{
    //	if(day === undefined)
    //		day = 0;
    //	let datetime = new Date();
    //	let gmtOffsetString = getGMTOffset(datetime);
    //	let output: string;
    //	datetime.setDate(datetime.getDate() - datetime.getDay() + day);
    //	return getDayString(datetime);
    //}
    /**
     * Gets string version of a date
     * @param datetime the given time
     */
    //export function makeDayStringGMT(datetime?: Date)
    //{
    //	if(!datetime)
    //		datetime = new Date();
    //	return Utilities.formatDate(datetime, 'GMT', 'yyyy-MM-dd');
    //}
    /**
     * Makes a deep clone (as opposed to shallow) will break on recursive references.
     * @param input variable to be deep cloned
     */
    function deepClone(input) {
        //TODO make this better by not doing the whole JSON thing.
        return JSON.parse(JSON.stringify(input));
    }
    Benji.deepClone = deepClone;
    function shalowCloneArray(input) {
        return [...input];
    }
    Benji.shalowCloneArray = shalowCloneArray;
    function objToArray_dropKey(input) {
        let output = [];
        for (let key in input)
            output.push(input[key]);
        return output;
    }
    Benji.objToArray_dropKey = objToArray_dropKey;
    function objToArray(input) {
        let output = [];
        for (let key in input)
            output.push({ key: key, value: input[key] });
        return output;
    }
    Benji.objToArray = objToArray;
    function makeMap(input, getKey) {
        let output = {};
        for (let i = 0; i < input.length; i++) {
            let val = input[i];
            let key = getKey(val);
            if (output.hasOwnProperty(key))
                throw new Error(`Array ${input.toString()} has a duplicate value at ${i}.`);
            output[key] = val;
        }
        return output;
    }
    Benji.makeMap = makeMap;
    /**
     * Shuffles array in place.
     * @param array An array containing the items.
     */
    function shuffle(array) {
        var j, x, i;
        for (i = array.length - 1; i > 0; i--) {
            j = Math.floor(Math.random() * (i + 1));
            x = array[i];
            array[i] = array[j];
            array[j] = x;
        }
        return array;
    }
    Benji.shuffle = shuffle;
})(Benji || (Benji = {}));
//# sourceMappingURL=General.js.map