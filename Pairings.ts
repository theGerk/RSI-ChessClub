/// <reference path="Constants.ts"/>
/// <reference path="SimulatedAnnealing.ts"/>

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


		export function ComparePairingMethods(input: IPlayer[], runs: number = 1000): { [testName: string]: ITestReturn }
		{
			input = [...input];
			if(input.length % 2 !== 0)
				input.push(null);
			return {
				"Stupid Greedy (first used method)": doTest(input, stupidGreedy, runs),
				"Pure Hill climb": doTest(input, hillClimb, runs),
				"Pure Random": doTest(input, randomPairing, runs),
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
		return output.sort(x => x.cost);
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

					//swap if we find better solution
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
}