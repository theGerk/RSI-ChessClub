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
				generate_attendance_sheet: 1,
				pair: 2,
				room: 3,
				defaultPairingPool: 4,
			},
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
			master: "Master Sheet",
			columns: {
				guid: 0,
				name: 1,
				group: 2,
				grade: 3,
				teacher: 4,
				level: 5,
				gender: 6,
				chesskid: 7,
				gamesPlayed: 8,
				rating: 9,
				ratingDeviation: 10,
				ratingVolatility: 11,
				tournamentHistory: 12,
				active: 13,
			},
		},
		attendance: {
			template: "Template-Attendance",
			metadata: {
				/** Identifies an attendance sheet */
				key: 'attendanceSheet',
				/** Has the name of the group */
				groupName: 'name',
				grade: 'grade',
			},
			columns: {
				name: 0,
				rating: 1,
				attending: 2,
				pair: 3,
				pairingPool: 4,
				guid: 5,
			},
		},
		pairing: {
			template: "Template-Pairings",
			metadata: {
				/** Identifies a paring sheet */
				key: 'pairingSheet',
				/** Has array of group's included (JSON format) */
				pool: 'name',
			},
			columns: {
				whiteResult: 0,
				whitePlayer: 1,
				blackResult: 2,
				blackPlayer: 3,
			},
			byeString: "BYE",
		},
		history: {
			name: 'Data',
			columns: {
				date: 0,
				games: 1,
				attendance: 2,
				signout: 3,
			},
		},
		signout: {
			template: 'Template-Signout',
			metadata: {
				key: 'printSheet',
			},
			columns: {
				name: 0,
				group: 1,
				room: 2,
				here: 3,
				guid: 5,
				signedOut: 6,
			},
			name: 'Signout Printoff',
		},
		permisions: {
			name: "Permisions",
			columns: {
				humanName: 0,
				email: 1,
				permision_permsionSetting: 2,
				permision_playerEditing: 3,
				permision_roundPairing: 4,
				permision_editingGroupPage: 5,
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
			rows: 30,
        },
        pairingPools: {
            name: 'Pairing Pools',
            columns: {
                name: 1,
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
	/** A null in the array refers to a bye, most recent games are at the end of the array, first game is at the beggining. */
	pairingHistory: { opponent: string, white: boolean }[];
	active: boolean;
	gamesPlayed: number;
	guid: string;
};


