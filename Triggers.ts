/// <reference path="Constants.ts"/>


function onOpen(e)
{
	let mainMenu = SpreadsheetApp.getUi().createMenu(CONST.menu.mainInterface.name);
	mainMenu
		.addItem('refresh attendance', (<any>GenerateAttendanceSheets).name)
		.addItem('submit attendance', (<any>AmmendAttendance).name)
		.addItem('generate pairings', (<any>CreatePairingSheets).name)
		.addItem('generate signout sheet', (<any>GenerateSignoutSheet).name);
	if(Session.getActiveUser().getEmail().toLowerCase() === 'benji@altmansoftwaredesign.com')
		mainMenu
			.addItem('generate pairings', (<any>CreatePairingSheets).name)
			.addItem('submit name changes', (<any>UpdatePlayers).name)
			.addSeparator()
			.addItem('set attendance', (<any>SubmitAttendance).name)
			.addItem("check duplicate names", (<any>checkDuplicateNames).name);
	mainMenu.addToUi();
}


function GenerateAttendanceSheets()
{
	FrontEnd.Attendance.GenerateAttendanceSheets();
}

function SubmitAttendance()
{
	FrontEnd.Attendance.SubmitAttendance(true);
}

function AmmendAttendance()
{
	FrontEnd.Attendance.SubmitAttendance(false);
}

function CreatePairingSheets()
{
	let attendance = FrontEnd.Attendance.getTodayData();
	FrontEnd.Games.GeneratePairings(attendance);
}

function GenerateSignoutSheet()
{
	let groupData = FrontEnd.Groups.getData();
	let attendance = FrontEnd.Attendance.getTodayData();
	let signoutData: FrontEnd.SignoutSheet.data[] = [];
	for(let name in attendance)
	{
		let person = attendance[name];
		signoutData.push({
			name: name,
			room: groupData[person.group].room,
			group: person.group,
		});
	}
	signoutData.sort((a, b) =>
	{
		let getNameString = function(s: string)
		{
			let split = s.split(' ');
			let lastName = (split.length > 1) ? split.pop() : '';
			return lastName + ' ' + split.join(' ');
		}
		return getNameString(a.name).localeCompare(getNameString(b.name));
	});
	FrontEnd.SignoutSheet.write(signoutData);
}

function UpdatePlayers()
{
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
	FrontEnd.Games.recordAndRemove();
	FrontEnd.Master.setClub(club);

	//Also write data for attendance if that has not been done
	AmmendAttendance();
}