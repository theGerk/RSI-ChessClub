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
		gameLog: {
			name: 'Game Log',
			columns: {
				data: 0,
			},
		},
        mainPage: {
            name: "Master List",
            columns: {
                name: 0,
                group: 1,
                rating: 2,
                ratingDeviation: 3,
				ratingVolatility: 4,
				grade: 5,
            },
        },
    },
    templates: {
		attendance: {
            name: "Template-Attendance",
            columns: {
                name: 0,
                rating: 1,
                attendance: 2,
                dontPair: 3,
            },
		},
		pairing: {
			name: "Template-Pairings",
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