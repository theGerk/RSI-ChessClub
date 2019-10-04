namespace FrontEnd
{
	export namespace TournamentPairings
	{
		export function GeneratePairings()
		{
			//get attendance data
			let attendace = FrontEnd.Attendance.getTodayData();
			let club = FrontEnd.Master.getClub();

			let playersToPair: IPlayer[] = [];

			//get array of players to be paired
			for(let i = attendace.length - 1; i >= 0; i--)
			{
				let current = attendace[i];
				if(current.attending && current.pair)
					playersToPair.push(club[current.name]);
			}

			//pair everyone
			let pairings = Pairings.pair(playersToPair, true);

			//handle white and black players separately as otherwise equations can get overwritten
			let white: string[][] = [];
			let black: string[][] = [];
			for(let i = pairings.length - 1; i >= 0; i--)
			{
				let current = pairings[i];
				white.push([current.white.name]);
				black.push([current.black.name]);
			}

			let spreadsheet = SpreadsheetApp.getActive();

			//do things to the sheet
			let sheet = TemplateSheets.generate(spreadsheet, spreadsheet.getSheetByName(CONST.pages.pairing.template), pairings.length, CONST.pages.pairing.name, 1);
			sheet.getRange(2, CONST.pages.pairing.columns.whitePlayer + 1, pairings.length).setValues(white);
			sheet.getRange(2, CONST.pages.pairing.columns.blackPlayer + 1, pairings.length).setValues(black);
		}
	}
}