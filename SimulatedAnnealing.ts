namespace SimulatedAnnealing
{
	export function solve<T>(initialState: T, costFunction: (state: T) => number, getRandomNeighboor: (state: T) => T, moveProbability: (currentStateCost: number, candidateStateCost: number, tempature: number) => number, steps: number): T
	{
		let currentState = initialState;
		let currentCost = costFunction(currentState);

		//best modification
		let bestState = currentState;
		let bestCost = currentCost;


		for(let k = 1; k <= steps; k++)
		{
			let candidate = getRandomNeighboor(currentState);
			let candidateCost = costFunction(candidate);
			if(moveProbability(currentCost, candidateCost, steps / k) >= Math.random())
			{
				currentState = candidate;
				candidateCost = candidateCost;
			}

			//best modification
			if(candidateCost < bestCost)
			{
				bestState = candidate;
				bestCost = candidateCost;
			}
		}

		//check if best modification really matters
		if(bestCost < currentCost)
			Logger.log(`Better option was found.`);
		return bestState;
	}
}