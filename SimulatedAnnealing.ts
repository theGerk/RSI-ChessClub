namespace SimulatedAnnealing
{
	export function solve<T>(initialState: T, costFunction: (state: T) => number, getRandomNeighboor: (state: T) => T, moveProbability: (currentStateCost: number, candidateStateCost: number, tempature: number) => number, steps: number): T
	{
		let currentState = initialState;
		for(let k = 1; k <= steps; k++)
		{
			let candidate = getRandomNeighboor(currentState);
			if(moveProbability(costFunction(currentState), costFunction(candidate), steps / k) >= Math.random())
				currentState = candidate;
		}
		return currentState;
	}
}