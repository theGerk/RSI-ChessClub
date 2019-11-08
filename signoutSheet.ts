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

		/**
		 * Takes an array of data and generates a signout sheet from it
		 * @param people array of data to write
		 */
		export function write(people: IData[])
		{
			if(people.length === 0)
				return;
			let raw = people.map(reverse_mapping);
			let ss = SpreadsheetApp.getActive();
			let sheet = TemplateSheets.generate(ss, ss.getSheetByName(CONST.pages.signout_printout.template), raw.length, CONST.pages.signout_printout.name, 1);
			sheet.getRange(2, 1, raw.length, raw[0].length).setValues(raw);
			sheet.autoResizeColumns(1, raw[0].length);
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
				signoutData.push({
					name: lastnameify(name),
					room: groupData[person.group].room,
					group: person.group,
				});
			}

			signoutData.sort((a, b) => a.name.toLocaleLowerCase().localeCompare(b.name.toLocaleLowerCase()));

			FrontEnd.SignoutSheet.write(signoutData);
		}

	}
}