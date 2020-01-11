/// <reference path="Constants.ts"/>

namespace Pairings
{
	export interface IPairing
	{
		white: IPlayer;
		black: IPlayer;
	}

	/** Multiplicative constant, higher values disincentivize playing recent opponents */
	const K = 100;  //just a guess, may need to adjust as we go.

	/** Additive constant used to make sure two players with the same ratting cant constantly play each-other */
	const RATING_EPSILON = 1; //arbitrary number, hard to think of a good value or rule for what it maybe should be.


	/**
	 * Calculates cost for player to play given opponent. Formula should be documented.
	 * @param player current player
	 * @param opponent opponent player
	 */
	function cost(player: IPlayer, opponent: IPlayer): number
	{
		if(player === null)
			if(opponent === null)
				return 0;
			else
				return cost(opponent, player);

		let opponentRating = (opponent === null) ? player.rating : opponent.rating;

		//unrated players have to played any games, and have no rating so the cost of pairing them is free. No need to worry about history as they have never played
		if(!Glicko.israted(player.rating) || !Glicko.israted(opponentRating))
			return 0;

		//if the player is not unrated then 
		let ratingDif = Math.abs(player.rating.rating - opponentRating.rating);
		let gameHistoryCost = 0;
		let check = (opponent === null) ? ((i: number) => player.pairingHistory[i] === null) : ((i: number) => player.pairingHistory[i] !== null && player.pairingHistory[i].opponent === opponent.name);
		for(let i = 0; i < player.pairingHistory.length; i++)
			if(check(i))
				gameHistoryCost += 1 / (i + 1);

		return (ratingDif + RATING_EPSILON) * Math.pow(K, gameHistoryCost);
	}

	function whiteFraction(history: { white: boolean }[])
	{
		let hist = history.filter(x => x !== null);
		return hist.filter(x => x.white).length / hist.length;
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

	/**
	 * The initial pairing function that uses a greedy algorithm. This just goes through the players finding their best opponent until there are not players left.
	 * @param players
	 */
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

	/**
	 * This function takes in the players, pairs them using the inital stupidGreedy function and then does a pure hill climb algorithm from there.
	 * @param players An array of players to be paired
	 */
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

			//nulls should always be black (its okay if both are null)
			if(black === null)
				continue;
			else if(white === null)
			{
				pair.white = black;
				pair.black = white;
				continue;
			}

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
		return output.sort((x, y) => (x.cost - y.cost));
	}

	/**
	 * gets the total cost of a pairing
	 * @param pairings an array of pairings representing a complete 'round' pairing
	 */
	function totalCost(pairings: IPairing[]): number
	{
		let sum = 0;
		for(let i = pairings.length - 1; i >= 0; i--)
			sum += cost(pairings[i].white, pairings[i].black) + cost(pairings[i].black, pairings[i].white);
		return sum;
	}

	/** An array of the two colors in a pairing as a string. */
	const _colors = ((pairing: IPairing) => Object.keys(pairing))({ black: null, white: null });

	/**
	 * Makes a clone of a pairing
	 * @param pairing
	 */
	function duplicatePairing(pairing: IPairing): IPairing
	{
		return { white: pairing.white, black: pairing.black };
	}

	/**
	 * Finds the best neighboor of a pairing, used by hill climb function
	 * @param input
	 */
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
}