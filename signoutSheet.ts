namespace FrontEnd
{
	export namespace SignoutSheet
	{
		export interface data
		{
			name: string;
			group: string;
			room: string;
		}

		function reverse_mapping(d: data)
		{
			let output = [];
			output[CONST.pages.signout_printout.columns.name] = d.name;
			output[CONST.pages.signout_printout.columns.room] = d.room;
			output[CONST.pages.signout_printout.columns.group] = d.group;
			return output;
		}

		export function write(people: data[])
		{
			if(people.length === 0)
				return;
			let raw = people.map(reverse_mapping);
			let ss = SpreadsheetApp.getActive();
			let sheet = TemplateSheets.generate(ss, ss.getSheetByName(CONST.pages.signout_printout.template), raw.length, CONST.pages.signout_printout.name, 1);
			sheet.getRange(2, 1, raw.length, raw[0].length).setValues(raw);
			sheet.autoResizeColumns(1, raw[0].length);
		}
	}
}