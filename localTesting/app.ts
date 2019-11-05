







interface IClub
{
	[name: string]: IPlayer
}

//describes a person in our club
interface IPlayer
{
	name: string;
	group: string;
	grade: number | string;
	teacher: string;
	level: string;
	gender: string;
	chesskid: string;
	rating: Glicko.IRating;
	pairingHistory: { opponent: string, white: boolean }[];
	active: boolean;
};


/** Things that I write that I use everywhere */
namespace Benji
{
	//export function getDayString(date: Date)
	//{
	//	return Utilities.formatDate(date, getGMTOffset(date), 'yyyy-MM-dd');
	//}

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

/** Works using GLICKO-2, but with some minor modifications to what the initial rating and deviations are. This doesn't actually change the algorithm, simply sifts the curve slightly */
namespace Glicko
{
	/** The rating interface, describes what a glicko rating must have. */
	export interface IRating
	{
		/** The rating */
		rating: number;
		/** The deviation */
		deviation: number;
		/** The volatility, this is kept secret. */
		volatility: number;
	}

	/** The system constant, \tau, which constrains the change in volatility over time... */
	const TAU = .5;	//TODO test with different values once a largish sample has been obtained.
	export const INITIAL_RATING = 1500;
	export const INITIAL_DEVIATION = 350;
	const INITIAL_VOLATILITY = .06;
	const DEFAULT_GLICKO_2_RATING = 0;
	const DEFAULT_GLICKO_2_DEVIATION = 350 / 173.7178;
	const GLICKO_2_CONVERSTION_CONSTANT = Glicko.INITIAL_DEVIATION / DEFAULT_GLICKO_2_DEVIATION;
	const CONVERGENCE_TOLERANCE = 0.000001;

	/**
	 * Checks if a rating is for an unrated player
	 * @param rating the player's rating
	 */
	export function israted(rating: IRating)
	{
		return !!rating.deviation;
	}

	/**
	 * Initializes a rating to the default values, rating will probably already be set though. Will do nothing a rating that is already initialized.
	 * @param rating a rating object to be initialized
	 */
	function setRating(rating: IRating)
	{
		if(israted(rating))
			return;

		if(!(typeof (rating.rating) === 'number' && isFinite(rating.rating)))
			rating.rating = Glicko.INITIAL_RATING;

		rating.deviation = Glicko.INITIAL_DEVIATION;
		rating.volatility = INITIAL_VOLATILITY;
	}


	/**
	 * Converts everyone who is rated to glicko-2
	 * @param everyone
	 */
	function convertToGlicko2(everyone: IRating[])
	{
		for(let i = 0; i < everyone.length; i++)
		{
			if(israted(everyone[i]))
			{
				everyone[i].rating = (everyone[i].rating - Glicko.INITIAL_RATING) / GLICKO_2_CONVERSTION_CONSTANT;
				everyone[i].deviation /= GLICKO_2_CONVERSTION_CONSTANT;
			}
		}
	}

	/**
	 * Converts from the standard glicko ratings (normalized about 0), to the user facing values. Skips anyone who is yet to be rated
	 * @param everyone an array of everyone's glicko rating
	 */
	function convertFromGlicko2(everyone: IRating[])
	{
		for(let i = 0; i < everyone.length; i++)
		{
			if(israted(everyone[i]))
			{
				everyone[i].rating = everyone[i].rating * GLICKO_2_CONVERSTION_CONSTANT + Glicko.INITIAL_RATING;
				everyone[i].deviation *= GLICKO_2_CONVERSTION_CONSTANT;
			}
		}
	}

	/**
	 * Makes an array of objects used in calculating the rating changes for each player. This is described at the end of step 2 in the glicko2.pdf
	 * @param player Player whose opponents object we are making
	 * @param games Array of all games played
	 * @param ratingMap Function mapping from whatever games[i].white may be to a rating object\
	 * @returns the array of objects that we want
	 */
	function makeOpponentArray<T>(player: IRating, games: { white: T, black: T, result: number }[], ratingMap: (key: T) => IRating): { rating: number, deviation: number, score: number }[]
	{
		/**
		 * Makes an object for a match from one player's perspective.
		 * @param opponent the opponent
		 * @param score the result of the game from the player's perspective
		 * @returns The object for this match
		 */
		function makeObj(opponent: IRating, score: number)
		{
			return {
				rating: opponent.rating,
				deviation: opponent.deviation,
				score: score
			};
		}

		let output: { rating: number, deviation: number, score: number }[] = [];

		for(let i = 0; i < games.length; i++)
		{
			if(games[i].white === games[i].black)
				throw new Error(`No one can play themselves!`);

			//check is player is white player
			else if(ratingMap(games[i].white) === player)
				output.push(makeObj(ratingMap(games[i].black), games[i].result));

			//check if player is black player
			else if(ratingMap(games[i].black) === player)
				output.push(makeObj(ratingMap(games[i].white), 1 - games[i].result));
		}

		return output;
	}

	/**
	 * Does a rating period of glicko ratings
	 * @param ratingMap Takes in some identifier and returns a reference to a rating object.
	 * @param games Has a white and black player and result from white's perspective, white and black will be fed into the ratingMap to get their rating object
	 * @param everyone A array of every rating object in the system.
	 */
	export function doRatingPeriod<T>(ratingMap: (key: T) => IRating, games: { white: T, black: T, result: number }[], everyone: IRating[])
	{
		//Step 1: Determine a rating and RD (deviation) for each player at the onset of the rating period.
		//Go through every player that played and make sure they are rated, if they aren't then initialize their rating.
		for(let i = 0; i < games.length; i++)
		{
			setRating(ratingMap(games[i].white));
			setRating(ratingMap(games[i].black));
		}

		//Step 2: For each player, convert the ratings and RD's (deviation's) onto the Glicko-2 scale.
		convertToGlicko2(everyone);


		let opponentArrays: { rating: number, deviation: number, score: number }[][] = [];
		for(let i = 0; i < everyone.length; i++)
			opponentArrays.push(makeOpponentArray(everyone[i], games, ratingMap));

		/** Function defined in step 3 */
		function g(deviation: number) { return 1 / Math.sqrt(1 + 3 * (deviation * deviation) / (Math.PI * Math.PI)); }
		/** Function defined in step 3 */
		function E(rating: number, opponentRating: number, opponentDeviation: number) { return 1 / (1 + Math.exp(-g(opponentDeviation) * (rating - opponentRating))); }


		for(let i = 0; i < everyone.length; i++)
		{
			let me = everyone[i];
			if(!israted(me))
				continue;

			let opponentArray = opponentArrays[i];
			//if the opponent does not compete during the rating period, described after step 8.
			if(opponentArray.length === 0)
			{
				let deviation = me.deviation;
				let volatility = me.volatility;
				me.deviation = Math.sqrt(deviation * deviation + volatility * volatility);
				continue;
			}


			//Step 3: Compute the quantity $v$. This is the estimated variance of the team's/player's rating based only on game outcomes.
			let estimatedVariance = 0;
			for(let j = 0; j < opponentArray.length; j++)
			{
				let tempG = g(opponentArray[j].deviation);
				let tempE = E(me.rating, opponentArray[j].rating, opponentArray[j].deviation);
				estimatedVariance += tempG * tempG * tempE * (1 - tempE)
			}
			estimatedVariance = 1 / estimatedVariance;


			//Step 4: Compute the quantity $\Delta$, the estimated improvement in rating by comparing the pre-period rating the performance rating based only on game outcomes.
			let estimatedImprovement = 0;
			for(let j = 0; j < opponentArrays[i].length; j++)
				estimatedImprovement += g(opponentArray[j].deviation) * (opponentArray[j].score - E(me.rating, opponentArray[j].rating, opponentArray[j].deviation));
			estimatedImprovement *= estimatedVariance;


			//Step 5: Determine the new value, $\sigma'$, of the volatility. This computation requires iteration.
			//part 1:
			let a = Math.log(me.volatility * me.volatility);
			function f(x: number)
			{
				let exp_x = Math.exp(x);
				let deviationSquared = me.deviation * me.deviation;
				let tempSum = deviationSquared + estimatedVariance + exp_x;
				return exp_x * (estimatedImprovement * estimatedImprovement - deviationSquared - estimatedVariance - exp_x) / (2 * tempSum * tempSum) - (x - a) / (TAU * TAU);
			}

			//part 2:
			let A = a;
			let B;
			if(estimatedImprovement * estimatedImprovement > me.deviation * me.deviation + estimatedVariance)
				B = Math.log(estimatedImprovement * estimatedImprovement - me.deviation * me.deviation - estimatedVariance);
			else
			{
				let k = 1;
				while(f(a - k * TAU) < 0)
					k++;
				B = a - k * TAU;
			}

			//part 3:
			let f_a = f(A);
			let f_b = f(B);

			//part 4:
			while(Math.abs(B - A) > CONVERGENCE_TOLERANCE)
			{
				//a)
				let C = A + (A - B) * f_a / (f_b - f_a);
				let f_c = f(C);

				//b)
				if(f_c * f_b < 0)
				{
					A = B;
					f_a = f_b;
				}
				else
				{
					f_a /= 2;
				}

				//c)
				B = C;
				f_b = f_c;
			}

			//part 5:
			me.volatility = Math.exp(A / 2);


			//Step 6: Update the rating deviation to the new pre-rating period value, $\phi^*$
			let tempDeviation = Math.sqrt(me.deviation * me.deviation + me.volatility * me.volatility);


			//Step 7: Update the rating and RD to the new values $\mu'$ and $\phi'$
			me.deviation = 1 / Math.sqrt(1 / (tempDeviation * tempDeviation) + 1 / estimatedVariance);
			let sum = 0;
			for(let j = 0; j < opponentArray.length; j++)
				sum += g(opponentArray[j].deviation) * (opponentArray[j].score - E(me.rating, opponentArray[j].rating, opponentArray[j].deviation));
			me.rating += tempDeviation * tempDeviation * sum;
		}


		//Step 8: Convert back to original scale
		convertFromGlicko2(everyone);
	}
}


namespace Pairings
{
	export namespace Testing
	{
		export interface ITestReturn
		{
			runs: number;
			totalTime: number;
			costs: number[];
		}


		export function comparePreformance(input: IPlayer[], runs: number = 1000): { [testName: string]: ITestReturn }
		{
			input = [...input];
			if(input.length % 2 !== 0)
				input.push(null);
			return {
				"Pure Random": doTest(input, randomPairing, runs),
				"Stupid Greedy (first used method)": doTest(input, stupidGreedy, runs),
				"Pure Hill Climb": doTest(input, hillClimb, runs),
				"Greedy Hill Climb": doTest(input, greedyInitClimb, runs),
				"Quick Hill Climb (Pure)": doTest(input, quickClimb(randomPairing), runs),
				"Quick Hill Climb (Greedy)": doTest(input, quickClimb(stupidGreedy), runs),
			};
		}

		function doTest(players: IPlayer[], func: (input: IPlayer[]) => IPairing[], runs: number): ITestReturn
		{
			let costs: number[] = [];
			let start = Date.now();
			for(let i = 0; i < runs; i++)
				costs.push(totalCost(func(players)));
			let end = Date.now();
			return { runs: runs, totalTime: end - start, costs: costs };
		}
	}



	export interface IPairing
	{
		white: IPlayer;
		black: IPlayer;
	}

	/** Multiplicative constant, higher values disincentivizes playing recent opponents */
	const K = 100;  //just a guess, may need to adjust as we go.

	/**
	 * Calculates cost for player to play given opponent. Formula should be documented.
	 * @param player current player
	 * @param opponent opponent player
	 */
	function cost(player: IPlayer, opponent: IPlayer): number
	{
		//null player refers to a bye, that has cost of 0 always
		if(player === null || opponent === null)
			return 0;

		//unrated players have to played any games, and have no rating so the cost of pairing them is free. No need to worry about history as they have never played
		if(!Glicko.israted(player.rating) || !Glicko.israted(opponent.rating))
			return 0;

		//if the player is not unrated then 
		let ratingDif = Math.abs(player.rating.rating - opponent.rating.rating);
		let gameHistoryCost = 0;
		for(var i = 0; i < player.pairingHistory.length; i++)
			if(player.pairingHistory[i].opponent === opponent.name)
				gameHistoryCost += 1 / (i + 1);
		return ratingDif * Math.pow(K, gameHistoryCost);
	}

	function whiteFraction(history: { white: boolean }[])
	{
		return history.filter(x => x.white).length / history.length;
	}

	/**
	 * Pairs everyone in players array
	 * @param players array of players
	 * @param dontCopy set to truthy value only if the ordering in players array does not mater.
	 * @returns an array of pairings
	 */
	export function pair(players: IPlayer[]): IPairing[]
	{
		players = [...players];

		if(players.length % 2 !== 0)
			players.push(null);

		return assignColor(hillClimb(players));
	}

	function stupidGreedy(players: IPlayer[]): IPairing[]
	{
		//shuffle for randomness
		players = players.filter(p => p !== null);
		Benji.shuffle(players);

		let output: IPairing[] = [];
		let usedSet: { [name: string]: boolean } = {};

		for(var i = players.length - 1; i >= 0; i--)
		{
			let player = players[i];


			//don't do someone who has already been paired
			if(usedSet.hasOwnProperty(player.name))
				continue;

			//they are about to be paired now
			usedSet[player.name] = true;

			//get costs array
			let costs = getCosts(player, players.filter(p => !usedSet.hasOwnProperty(p.name)));

			if(costs.length === 0)
			{
				output.push({ white: player, black: null });
				break;
			}


			let opponent = costs[0].player;
			usedSet[opponent.name] = true;

			output.push({ white: player, black: opponent });
		}
		return output;
	}

	function hillClimb(players: IPlayer[]): IPairing[]
	{
		let state = randomPairing(players);
		let cost = totalCost(state);

		while(true)
		{
			let newState = getBestNeighboor(state);
			let newCost = totalCost(newState);


			if(cost <= newCost)
			{
				return state;
			}
			else
			{
				state = newState;
				cost = newCost;
			}
		}
	}


	function greedyInitClimb(players: IPlayer[]): IPairing[]
	{
		let state = stupidGreedy(players);
		let cost = totalCost(state);

		while(true)
		{
			let newState = getBestNeighboor(state);
			let newCost = totalCost(newState);


			if(cost <= newCost)
			{
				return state;
			}
			else
			{
				state = newState;
				cost = newCost;
			}
		}
	}


	//function simulatedAnnealing(players: IPlayer[]): IPairing[]
	//{

	//}

	function randomPairing(players: IPlayer[]): IPairing[]
	{
		Benji.shuffle(players);

		let output: IPairing[] = [];

		for(let i = players.length - 1; i >= 0; i -= 2)
			output.push({ white: players[i], black: players[i - 1] });

		return output;
	}


	/**
	 * Assigns colors to both an already created pairings
	 * @param pairing
	 */
	function assignColor(pairing: IPairing[])
	{
		for(let i = pairing.length - 1; i >= 0; i--)
		{
			let pair = pairing[i];
			let white = pair.white;
			let black = pair.black;

			if(white === null || black === null)
				continue;

			//find how often each player is white
			let whiteRatio = whiteFraction(white.pairingHistory);
			let blackRatio = whiteFraction(black.pairingHistory);

			//if white has been white more often then switch it, otherwise do nothing
			if(whiteRatio > blackRatio)
			{
				pair.white = black;
				pair.black = white;
			}
		}
		return pairing;
	}


	/**
	 * Gets sorted costs of each game
	 * @param player Player for whom we are getting this array
	 * @param others A list of all players to compare against
	 * @returns
	 */
	function getCosts(player: IPlayer, others: IPlayer[])
	{
		let output: { cost: number, player: IPlayer }[] = [];
		for(var i = others.length - 1; i >= 0; i--)
		{
			let other = others[i];
			if(player !== other)
			{
				output.push({
					cost: cost(player, other),
					player: other
				});
			}
		}
		return output.sort((x,y) => x.cost - y.cost);
	}


	function totalCost(pairings: IPairing[]): number
	{
		let sum = 0;
		for(let i = pairings.length - 1; i >= 0; i--)
			sum += cost(pairings[i].white, pairings[i].black) + cost(pairings[i].black, pairings[i].white);
		return sum;
	}

	const _colors = function(pairing: IPairing) { return Object.keys(pairing) }({ black: null, white: null });

	function duplicatePairing(pairing: IPairing): IPairing
	{
		return { white: pairing.white, black: pairing.black };
	}

	function getBestNeighboor(input: IPairing[]): IPairing[]
	{
		let best = input;
		let bestCost = totalCost(input);
		let length = input.length;

		for(let i = 1; i < length; i++)
			for(let j = 0; j < i; j++)
				//Only two possible colors, white and black in chess. Should not be a problem to hard-code this two.
				for(let colorIndex = 0; colorIndex < 2; colorIndex++)
				{
					let current = [...input];

					let iPair = current[i] = duplicatePairing(current[i]);
					let jPair = current[j] = duplicatePairing(current[j]);

					let color = _colors[colorIndex];

					//swap between iPair.white and jPair[color].
					let tmp = iPair.white;
					iPair.white = jPair[color]
					jPair[color] = tmp;

					let cost = totalCost(current);
					if(cost < bestCost)
					{
						bestCost = cost;
						best = current;
					}
				}

		return best;
	}

	/**
	 * The neighbor function
	 * @param input
	 */
	function swapRandomPlayers(input: IPairing[]): IPairing[]
	{
		let length = input.length;

		//nothing to do if it has no length
		if(length === 0)
			return input;

		let output: IPairing[] = [...input];


		let xPairing = (Math.random() * length) | 0;
		let xColor = _colors[(Math.random() * 2) | 0];
		let yPairing = (Math.random() * (length - 1)) | 0;
		let yColor = _colors[(Math.random() * 2) | 0];

		if(yPairing >= xPairing)
			yPairing++; //yPairing should never equal xPairing using this.


		//now swap x and y
		let xPair = duplicatePairing(input[xPairing]);
		let yPair = duplicatePairing(input[yPairing]);

		let tmp = xPair[xColor];
		xPair[xColor] = yPair[yColor];
		yPair[yColor] = tmp;

		output[xPairing] = xPair;
		output[yPairing] = yPair;

		return output;
	}


	function quickClimb(init: (IPlayer[]) => IPairing[])
}
















let fs = require('fs');
let text = fs.readFileSync('club.json', 'utf8');
let club: IPlayer[] = Benji.objToArray_dropKey(JSON.parse(text));

let output = Pairings.Testing.comparePreformance(club, 100);

for(let test in output)
{
	output[test].costs.sort((a,b)=>a-b);
	let min = output[test].costs[0];
	let max = output[test].costs[output[test].costs.length - 1];
	let mean = output[test].costs.reduce((a, b) => a + b, 0) / output[test].costs.length;
	let median = (output[test].costs.length % 2 === 0)
		? ((output[test].costs[output[test].costs.length / 2] + output[test].costs[output[test].costs.length / 2 - 1]) / 2)
		: (output[test].costs[(output[test].costs.length - 1) / 2]);

	console.log(`${test}:
After ${output[test].runs} tests run in ${output[test].totalTime} milliseconds we find the following costs:
min: ${min}
max: ${max}
mean: ${mean}
median: ${median}
`);
}

console.log('hello world');


