
function test()
{
	let clubArray = FrontEnd.Master.getActivePlayersArray();
	let playerCount = clubArray.length;
	let clubMap = Benji.makeMap(clubArray, (p) => p.name);
	for(let i = 0; i < 20; i++)
	{
		let pairings = Pairings.pair(clubArray);

		let gamesResults: { Tournament: FrontEnd.Games.IGame[], Other: FrontEnd.Games.IGame[] } = { Tournament: [], Other: [] }

		//put in tournament games
		for(let j = 0; j < pairings.length; j++)
		{
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

		while(Math.random() < .92)
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
}