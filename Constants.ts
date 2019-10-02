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
			}
		},
		gameLog: {
			name: 'Game Log',
			columns: {
				data: 0,
			},
		},
		mainPage: {
			name: "Master List",
			storage: "Deep Storage",
			columns: {
				name: 0,
				group: 1,
				rating: 2,
				ratingDeviation: 3,
				ratingVolatility: 4,
				grade: 5,
				tournamentHistory: 6,
			},
		},
		attendance: {
			template: "Template-Attendance",
			metadata: {
				/** Identifies an attendence sheet */
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
	rating: Glicko.IRating;
	group: string;
	grade: number | string;
	active: boolean;
	pairingHistory: string[];
};


