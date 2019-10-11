///<reference path="Constants.ts"/>
///<reference path="Pairings.ts"/>

let fs = require('fs');
let club = JSON.parse(fs.readFileSync('club.json', 'utf8'));

for(let i = 0; i < 10; i++)
	console.log('hello world');

