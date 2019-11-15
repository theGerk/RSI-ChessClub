namespace FrontEnd
{
	export namespace SignoutSheet
	{
		export interface IData
		{
			name: string;
			group: string;
			room: string;
		}

		/**
		 * Takes a data object and turns it into a raw row
		 * @param d
		 */
		function reverse_mapping(d: IData)
		{
			let output = [];
			output[CONST.pages.signout_printout.columns.name] = d.name;
			output[CONST.pages.signout_printout.columns.room] = d.room;
			output[CONST.pages.signout_printout.columns.group] = d.group;
			return output;
		}

		export function remove()
		{
			TemplateSheets.deleteSheet(SpreadsheetApp.getActive(), CONST.pages.signout_printout.name);
			_cache = null;
		}

		var _cache: any[][];

		/**
		 * Takes an array of data and generates a signout sheet from it
		 * @param people array of data to write
		 */
		export function write(people: IData[])
		{
			if(people.length === 0)
				return;
			_cache = people.map(reverse_mapping);
			let ss = SpreadsheetApp.getActive();
			let sheet = TemplateSheets.generate(ss, ss.getSheetByName(CONST.pages.signout_printout.template), _cache.length, CONST.pages.signout_printout.name, 1);
			sheet.getRange(2, 1, _cache.length, _cache[0].length).setValues(_cache);
			sheet.autoResizeColumns(1, _cache[0].length);
		}

		export function GenerateSignoutSheet(attendance?: { [name: string]: FrontEnd.Attendance.IAttendanceData })
		{
			let groupData = FrontEnd.Groups.getData();
			if(!attendance)
				attendance = FrontEnd.Attendance.getTodayData();
			let signoutData: FrontEnd.SignoutSheet.IData[] = [];

			function lastnameify(name: string)
			{
				let split = name.split(' ');
				let lastName = (split.length > 1) ? split.pop() : '';
				return lastName + ', ' + split.join(' ');
			}

			for(let name in attendance)
			{
				let person = attendance[name];
				if(person.attending)
					signoutData.push({
						name: lastnameify(name),
						room: groupData[person.group].room,
						group: person.group,
					});
			}

			signoutData.sort((a, b) => a.name.toLocaleLowerCase().localeCompare(b.name.toLocaleLowerCase()));

			write(signoutData);
		}

	}
}