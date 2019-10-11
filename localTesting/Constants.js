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
        extraGames: {
            name: 'Other Games',
            columns: {
                white: 0,
                black: 2,
                result: 1,
            },
        },
        mainPage: {
            name: "Master List",
            storage: "Inactive Players",
            columns: {
                name: 0,
                group: 1,
                grade: 2,
                teacher: 3,
                level: 4,
                gender: 5,
                chesskid: 6,
                rating: 7,
                ratingDeviation: 8,
                ratingVolatility: 9,
                tournamentHistory: 10,
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
    },
    menu: {
        mainInterface: {
            name: "RSI-Club",
        },
    },
};
;
//# sourceMappingURL=Constants.js.map