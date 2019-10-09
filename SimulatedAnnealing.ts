namespace SimulatedAnnealing
{
	export function solve<T>(initialState: T, costFunction: (state: T) => number, getRandomNeighboor: (state: T) => T, moveProbability: (currentState: T, candidateState: T, tempature: number) => number, steps: number): T
	{

	}
}