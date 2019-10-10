
function test()
{
	let n = 10;
	let players = Benji.objToArray_dropKey(club);
	let output = Pairings.Testing.ComparePairingMethods(players, n);
	for(let i in output)
	{
		let o = output[i];
		Logger.log(`${i}: running ${n} times
averageCost: ${o.costs.reduce((a, b) => a + b) / o.costs.length}
totalTime  : ${o.totalTime}`);
	}
	return output;
}

function setup(weeks: number = 20)
{
	let clubArray = FrontEnd.Master.getActivePlayersArray();
	let playerCount = clubArray.length;
	let clubMap = Benji.makeMap(clubArray, (p) => p.name);
	for(let c = 0; c < weeks; c++)
	{
		let pairings = Pairings.pair(clubArray);

		let gamesResults: { Tournament: FrontEnd.Games.IGame[], Other: FrontEnd.Games.IGame[] } = { Tournament: [], Other: [] }

		//put in tournament games
		for(let i = 0; i < pairings.length; i++)
		{
			if(pairings[i].white === null || pairings[i].black === null)
				continue;
			let random = Math.random();
			if(random < .2)
				continue;
			else if(random <= .575)
				gamesResults.Tournament.push({ white: pairings[i].white.name, black: pairings[i].black.name, result: 1 });
			else if(random <= .95)
				gamesResults.Tournament.push({ white: pairings[i].white.name, black: pairings[i].black.name, result: 0 });
			else
				gamesResults.Tournament.push({ white: pairings[i].white.name, black: pairings[i].black.name, result: .5 });
		}

		while(Math.random() < .85)
		{
			let index1 = Math.floor(Math.random() * playerCount);
			let index2 = Math.floor(Math.random() * (playerCount - 1));
			if(index2 >= index1)
				index2++;
			let result: number;
			let resultGenerator = Math.random();
			if(resultGenerator < .47)
				result = 0;
			else if(resultGenerator < .94)
				result = 1;
			else
				result = .5;

			gamesResults.Other.push({white:clubArray[index1].name, black:clubArray[index2].name, result: result})
		}

		//do ratings
		let everyoneRatings: Glicko.IRating[] = [];
		for(let index in clubMap)
			everyoneRatings.push(clubMap[index].rating);

		Glicko.doRatingPeriod(index => clubMap[index].rating, gamesResults.Tournament.concat(gamesResults.Other), everyoneRatings);


		//add games to history
		let tourny = gamesResults.Tournament;
		for(let i = tourny.length - 1; i >= 0; i--)
		{
			let currentGame = tourny[i];
			clubMap[currentGame.white].pairingHistory.push({ opponent: currentGame.black, white: true });
			clubMap[currentGame.black].pairingHistory.push({ opponent: currentGame.white, white: false });
		}
	}

	FrontEnd.Master.setClub(clubMap);
}


test();