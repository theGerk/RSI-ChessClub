/// <reference path="Constants.ts"/>


function onOpen(e)
{
	let mainMenu = SpreadsheetApp.getUi().createMenu(CONST.menu.mainInterface.name);
	if(Permision.doIHavePermsion(p => p.pairRounds))
		mainMenu
			.addItem('Submit attendance and pair', (<any>Pair).name)
			.addItem('Rever pairing', (<any>RevertPair).name);
	if(Permision.doIHavePermsion(p => p.editPlayers))
		mainMenu
			.addItem('Update players', (<any>UpdatePlayers).name);
	if(Session.getActiveUser().getEmail().toLowerCase() === 'benji@altmansoftwaredesign.com')
		mainMenu
			.addItem('force weekly update', (<any>WeeklyUpdate).name)
			.addItem("check duplicate names", (<any>checkDuplicateNames).name);
	mainMenu.addToUi();
}


function Pair()
{
	Permision.validatePermision(p => p.pairRounds);
	let attendance = FrontEnd.Attendance.SubmitAttendance(true);
	FrontEnd.Games.GeneratePairings(attendance);
	FrontEnd.SignoutSheet.GenerateSignoutSheet(attendance);
}

function RevertPair()
{
	Permision.validatePermision(p => p.pairRounds);
	FrontEnd.Attendance.GenerateAttendanceSheets();
	FrontEnd.Games.deletePairing();
}


function UpdatePlayers()
{
	Permision.validatePermision(p => p.editPlayers);
	/**
	 * Sets player with changes
	 * @param player
	 * @param change
	 */
	function set(player: IPlayer, change: FrontEnd.NameUpdate.IPlayerUpdate)
	{
		if(change.newName)
			player.name = change.name;
		player.active = change.active;
		player.chesskid = change.chessKid;
		player.group = change.group;
		player.level = change.level;
		player.gender = change.gender;
		player.grade = change.grade;
		player.teacher = change.teacher;
	}



	let changes = FrontEnd.NameUpdate.getData();
	let club = FrontEnd.Master.getClub();

	for(let i = 0; i < changes.length; i++)
	{
		let currentRow = changes[i];
		let me = club[currentRow.name];
		if(me)
		{
			if(me.name !== currentRow.name)
				throw new Error(`Duplicate in name change, ${currentRow.name} appears in multiple rows`);

			//TODO add more changes here
			set(me, currentRow);
		}
		else
		{
			club[currentRow.name] = {
				active: currentRow.active || true,
				chesskid: currentRow.chessKid,
				gamesPlayed: 0,
				gender: currentRow.gender,
				grade: currentRow.grade,
				group: currentRow.group,
				level: currentRow.level,
				name: currentRow.newName || currentRow.name,
				pairingHistory: [],
				rating: {
					rating: undefined,
					deviation: undefined,
					volatility: undefined,
				},
				teacher: currentRow.teacher,
			};
		}
	}

	FrontEnd.Master.setClub(club);
	FrontEnd.NameUpdate.remove();
	FrontEnd.NameUpdate.make();
}

/**
 * Consumes and commits to storage the games played
 * Does rating changes
 */
function WeeklyUpdate()
{
	Permision.validatePermision(p => false);
	let gamesResults = FrontEnd.Games.getResults();
	let club = FrontEnd.Master.getClub();


	//do ratings
	let everyoneRatings: Glicko.IRating[] = [];
	for(let name in club)
		everyoneRatings.push(club[name].rating);

	Glicko.doRatingPeriod(name => club[name].rating, gamesResults.Tournament.concat(gamesResults.Other), everyoneRatings);


	//add games to history
	let tourny = gamesResults.Tournament;
	for(let i = tourny.length - 1; i >= 0; i--)
	{
		let currentGame = tourny[i];
		club[currentGame.white].pairingHistory.push({ opponent: currentGame.black, white: true });
		club[currentGame.black].pairingHistory.push({ opponent: currentGame.white, white: false });
	}

	function countGame(game: FrontEnd.Games.IGame)
	{
		club[game.white].gamesPlayed++;
		club[game.black].gamesPlayed++;
	}

	//add to games played count
	for(let i = 0; i < gamesResults.Tournament.length; i++)
		countGame(gamesResults.Tournament[i]);
	for(let i = 0; i < gamesResults.Other.length; i++)
		countGame(gamesResults.Other[i]);


	//write data
	FrontEnd.Attendance.SubmitAttendance(false);
	FrontEnd.Games.recordAndRemove();
	FrontEnd.Master.setClub(club);

	//generate next weeks pairing page
	FrontEnd.Attendance.GenerateAttendanceSheets();
}