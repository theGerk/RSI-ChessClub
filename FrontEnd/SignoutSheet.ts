namespace FrontEnd {
	export namespace SignoutSheet {
		export interface IData {
			guid: string;
			name: string;
			group: string;
			room: string;
			here: boolean;
			signedOut: boolean;
		}

		function mapping(row: any[]): IData {
			return {
				group: row[CONST.pages.signout.columns.guid],
				signedOut: row[CONST.pages.signout.columns.signedOut],
				name: row[CONST.pages.signout.columns.name],
				room: row[CONST.pages.signout.columns.room],
				guid: row[CONST.pages.signout.columns.guid],
				here: row[CONST.pages.signout.columns.here],
			}
		}

		/**
		 * Takes a data object and turns it into a raw row
		 * @param d
		 */
		function reverse_mapping(d: IData) {
			let output = [];
			output[CONST.pages.signout.columns.guid] = d.guid;
			output[CONST.pages.signout.columns.signedOut] = d.signedOut;
			output[CONST.pages.signout.columns.name] = d.name;
			output[CONST.pages.signout.columns.room] = d.room;
			output[CONST.pages.signout.columns.group] = d.group;
			output[CONST.pages.signout.columns.here] = d.here;
			return output;
		}

		export function remove() {
			TemplateSheets.deleteSheet(SpreadsheetApp.getActive(), CONST.pages.signout.name);
			_cache = null;
		}

		var _cache: any[][];

		export function read(): IData[] {
			if (!_cache) {
				let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONST.pages.signout.name);
				if (!sheet) {
					_cache = [];
					return [];
				}
				_cache = sheet.getActiveRange().getValues().shift();
			}
			return _cache.map(mapping);
		}

		/**
		 * Takes an array of data and generates a signout sheet from it
		 * @param people array of data to write
		 */
		function write(people: IData[]) {
			if (people.length === 0)
				return;
			_cache = people.map(reverse_mapping);
			let ss = SpreadsheetApp.getActive();
			let sheet = TemplateSheets.generate(ss, ss.getSheetByName(CONST.pages.signout.template), _cache.length, CONST.pages.signout.name, 0);
			sheet.getRange(2, 1, _cache.length, _cache[0].length).setValues(_cache);
			sheet.autoResizeColumns(1, _cache[0].length);
		}

		export function GenerateSignoutSheet(attendance?: { [name: string]: FrontEnd.Attendance.IAttendanceData }) {
			let groupData = FrontEnd.Groups.getData();
			if (!attendance)
				attendance = FrontEnd.Attendance.getTodayData();
			let signoutData: FrontEnd.SignoutSheet.IData[] = [];

			function lastnameify(name: string) {
				let split = name.split(' ');
				let lastName = (split.length > 1) ? split.pop() : '';
				return lastName + ', ' + split.join(' ');
			}

			for (let name in attendance) {
				let person = attendance[name];
				//if(person.attending)
				signoutData.push({
					name: lastnameify(name),
					room: groupData[person.group].room,
					group: person.group,
					here: person.attending,
					guid: person.guid,
					signedOut: false,
				});
			}

			signoutData.sort((a, b) => a.name.toLocaleLowerCase().localeCompare(b.name.toLocaleLowerCase()));

			write(signoutData);
		}


		export function checkout(guids: {[guid: string]: true}) {
			let data = read();
			let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONST.pages.signout.name);
			if (!sheet)
				return;
			for (let i = data.length - 1; i >= 0; i--) {
				if (guids[data[i].guid]) {
					_cache[i][CONST.pages.signout.columns.signedOut] = true;
					sheet.getRange(i + 2, CONST.pages.signout.columns.signedOut + 1).setValue(true);
				}
			}
		}
	}
}