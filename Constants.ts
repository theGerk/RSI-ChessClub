//references
/// <reference path="node_modules/@types/google-apps-script/index.d.ts"/>


//constants
const CONST = {
	ratings: {
		initRating: 0,
		initDeviation: 350 / 173.7178,
		initVolatility: 0.06,
	},
	pages: {
		groupTable: {
			name: 'Groups',
			columns: {
				name: 0,
				pair: 1,
				room: 2,
			}
		},
		extraGames: {
			name: 'Other Games',
			columns: {
				white: 0,
				black: 2,
				result: 1,
			},
		},
		mainPage: {
			active: "Active Players",
			master: "Inactive Players",
			columns: {
				name: 0,
				group: 1,
				grade: 2,
				teacher: 3,
				level: 4,
				gender: 5,
				chesskid: 6,
				gamesPlayed: 7,
				rating: 8,
				ratingDeviation: 9,
				ratingVolatility: 10,
				tournamentHistory: 11,
				active: 12,
			},
		},
		attendance: {
			template: "Template-Attendance",
			metadata: {
				/** Identifies an attendance sheet */
				key: 'attendanceSheet',
				/** Has the name of the group */
				groupName: 'name',
			},
			columns: {
				name: 0,
				rating: 1,
				attendance: 2,
				pair: 3,
			},
		},
		pairing: {
			name: 'Tournament Pairings',
			template: "Template-Pairings",
			metadata: {
				/** Identifies a paring sheet */
				key: 'pairingSheet',
				/** Has array of group's included (JSON format) */
				groupName: 'name'
			},
			columns: {
				whiteResult: 0,
				whitePlayer: 1,
				blackResult: 2,
				blackPlayer: 3,
			},
		},
		history: {
			name: 'Data',
			columns: {
				date: 0,
				games: 1,
				attendance: 2,
			},
		},
		signout_printout: {
			template: 'Template-Print',
			metadata: {
				key: 'printSheet',
			},
			columns: {
				name: 0,
				group: 1,
				room: 2,
			},
			name: 'Signout Printoff',
		},
		permisions: {
			name: "INSERT PERMISIONS' PAGE'S NAME HERE",
			columns: {
				humanName: 0,
				email: 1,
				permisions: 2,
			},
		},
		updatePlayer: {
			name: "Add and Update Players",
			template: 'Template-Add and Update Players',
			columns: {
				name: 0,
				newName: 1,
				group: 2,
				grade: 3,
				teacher: 4,
				level: 5,
				gender: 6,
				chessKid: 7,
				active: 8,
			},
		},
	},
	menu: {
		mainInterface: {
			name: "RSI-Club",
		},
	},
};


interface IClub
{
	[name: string]: IPlayer
}

//describes a person in our club
interface IPlayer
{
	name: string;
	group: string;
	grade: number | string;
	teacher: string;
	level: string;
	gender: string;
	chesskid: string;
	rating: Glicko.IRating;
	pairingHistory: { opponent: string, white: boolean }[];
	active: boolean;
	gamesPlayed: number;
};


