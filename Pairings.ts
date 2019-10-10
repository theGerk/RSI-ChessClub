/// <reference path="Constants.ts"/>
/// <reference path="SimulatedAnnealing.ts"/>

namespace Pairings
{
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
	export function pair(players: IPlayer[], dontCopy?: boolean)
	{
		if(!dontCopy)
			players = [...players];

		//shuffle for randomness
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
				break;

			let opponent = costs[0].player;
			usedSet[opponent.name] = true;

			//assign black and white based on who has a lower ratio of black to white, otherwise simply do random
			let playerRatio = whiteFraction(player.pairingHistory);
			let opponentRatio = whiteFraction(opponent.pairingHistory);

			//do the push
			if(playerRatio < opponentRatio)
				output.push({ white: player, black: opponent });
			else if(playerRatio > opponentRatio)
				output.push({ black: player, white: opponent });
			else
				if(Math.random() > .5)
					output.push({ white: player, black: opponent });
				else
					output.push({ black: player, white: opponent });
		}
		return output;
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

	function swapRandomPlayers(pairings: IPairing[]): IPairing[]
	{
		let length = pairings.length;
		if(length === 0)
			return pairings;
		let output = [];
		output.length = length;
		let x = (Math.random() * length) | 0;
		let xColor = (Math.random() < .5) ? pairings;
		let y = (Math.random() * length) | 0;
		let yColor = Math.random();


	}
}