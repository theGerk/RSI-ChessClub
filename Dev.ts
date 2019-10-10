
function test()
{
	let players = FrontEnd.Master.getActivePlayersArray();
	for(let i = 0; i < 100; i++)
	{
		Logger.log(Pairings.totalCost(Pairings.pair(players)));
	}
}