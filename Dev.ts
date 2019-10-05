
function test()
{
	let day = new Date();
	Logger.log(day.getDate());
	Logger.log(day.getDay());
	Logger.log(Benji.getWeekString(day));
}