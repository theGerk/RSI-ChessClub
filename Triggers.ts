/// <reference path="Constants.ts"/>

function doGet(e) {

}

function onOpen(e) {
	generateMenu(false);
}

function generateMenu(checkPermisions: boolean) {
	let ui = SpreadsheetApp.getUi();
	let mainMenu = ui.createMenu(CONST.menu.mainInterface.name);
	if (!checkPermisions)
		mainMenu
			.addItem('Remove extra buttons', (<any>RemoveExtraButtons).name)
			.addSeparator();
	if (!checkPermisions || Permision.doIHavePermsion(p => p.pairRounds))
		mainMenu
			.addItem('Submit attendance and pair', (<any>Pair).name)
			.addItem('Revert pairing', (<any>RevertPair).name);
	if (!checkPermisions || Permision.doIHavePermsion(p => p.editPlayers))
		mainMenu
			.addItem('Update players', (<any>UpdatePlayers).name);
	if (!checkPermisions || Permision.doIHavePermsion(p => p.permision))
		mainMenu
			.addItem('Update permisions', (<any>UpdatePermisions).name);


	//------------just for me-------------
	if (Session.getActiveUser().getEmail().toLowerCase() === 'benji@altmansoftwaredesign.com')
		mainMenu
			.addSeparator()
			.addSubMenu(
				ui.createMenu("Developer Buttons")
					.addItem('force weekly update', (<any>WeeklyUpdate).name)
					.addItem("check duplicate names", (<any>checkDuplicateNames).name)
					.addItem('Recalculate', (<any>recalculate).name)
			);
	//-----------------------------------



	mainMenu.addToUi();
}

function UpdatePermisions() {
	Permision.doIHavePermsion(p => p.permision);
	FrontEnd.Attendance.setPermisions();
	FrontEnd.Data.setPermisions();
	FrontEnd.Games.setPermisions();
	FrontEnd.Groups.setPermisions();
	FrontEnd.Master.setPermisions();
	FrontEnd.NameUpdate.setPermisions();
	FrontEnd.PermisionPage.setPermisions();
}

function RemoveExtraButtons() {
	SpreadsheetApp.getActive().removeMenu(CONST.menu.mainInterface.name);
	generateMenu(true);
}


function Pair() {
	Permision.validatePermision(p => p.pairRounds);
	let attendance = FrontEnd.Attendance.SubmitAttendance(true);
	FrontEnd.Games.GeneratePairings(attendance);
	FrontEnd.SignoutSheet.GenerateSignoutSheet(attendance);
}

function RevertPair() {
	Permision.validatePermision(p => p.pairRounds);
	let ui = SpreadsheetApp.getUi();

	//MAKE A WARNING
	let doubleCheck = ui.alert("Warning!", `Are you sure you want to revert the pairing and destroy the current pairings?

Click YES to continue and PERMANENTLY destroy the current pairings.
Click NO if you want to stop and not do anything.
`, ui.ButtonSet.YES_NO);
	if (doubleCheck !== ui.Button.YES)
		return;

	FrontEnd.Games.deletePairing();
	FrontEnd.Attendance.GenerateAttendanceSheets();
}


function UpdatePlayers() {
	Permision.validatePermision(p => p.editPlayers);


	if (!FrontEnd.NameUpdate.exists()) {
		FrontEnd.NameUpdate.make();
		return;
	}


	/**
	 * Sets player with changes
	 * @param player
	 * @param change
	 */
	function set(player: IPlayer, change: FrontEnd.NameUpdate.IPlayerUpdate) {
		if (change.newName)
			player.name = change.newName;
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

	for (let i = 0; i < changes.length; i++) {
		let currentRow = changes[i];
		let me = club[currentRow.name];
		// I already exist.
		if (me) {
			if (me.name !== currentRow.name)
				throw new Error(`Duplicate in name change, ${currentRow.name} appears in multiple rows`);

			//TODO add more changes here
			set(me, currentRow);
		}
		// player doesn't exist yet.
		else {
			club[currentRow.name] = {
				active: typeof currentRow.active === 'boolean' ? currentRow.active : true,
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
				guid: Utilities.getUuid(),
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
function WeeklyUpdate() {
	Permision.validatePermision(p => false);
	let gamesResults = FrontEnd.Games.getResults();
	let club = FrontEnd.Master.getClub();


	//do ratings
	let everyoneRatings: Glicko.IRating[] = [];
	for (let name in club)
		everyoneRatings.push(club[name].rating);

	Glicko.doRatingPeriod(gamesResults.Tournament.Games.concat(gamesResults.Other).map(x => {
		return {
			white: club[x.white].rating,
			black: club[x.black].rating,
			result: x.result,
		};
	}), everyoneRatings);


	//add games to history
	let tourny = gamesResults.Tournament.Games;
	for (let i = tourny.length - 1; i >= 0; i--) {
		let currentGame = tourny[i];
		club[currentGame.white].pairingHistory.push({ opponent: currentGame.black, white: true });
		club[currentGame.black].pairingHistory.push({ opponent: currentGame.white, white: false });
	}
	//add byes to history
	gamesResults.Tournament.Byes.forEach(playerName => club[playerName].pairingHistory.push(null));

	function countGame(game: FrontEnd.Games.IGame) {
		club[game.white].gamesPlayed++;
		club[game.black].gamesPlayed++;
	}

	//add to games played count
	for (let i = 0; i < gamesResults.Tournament.Games.length; i++)
		countGame(gamesResults.Tournament.Games[i]);
	for (let i = 0; i < gamesResults.Other.length; i++)
		countGame(gamesResults.Other[i]);


	//write data
	FrontEnd.Attendance.SubmitAttendance(false);
	FrontEnd.Games.recordAndRemove();
	FrontEnd.Master.setClub(club);

	//update permisions just because
	UpdatePermisions();
}

function WeeklyUpdate_2() {
	//generate next weeks pairing page
	FrontEnd.Attendance.GenerateAttendanceSheets();

	FrontEnd.SignoutSheet.GenerateSignoutSheet();

	//update permisions just because
	UpdatePermisions();
}