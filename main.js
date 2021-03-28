$(document).ready(function(){
	$('#csv-input').click(getCsvFName);
});

function getCsvFName()
{
	var csvFileName = $('#csv-fname').val();

	if (csvFileName.length > 0) readCsv(csvFileName);
	else                        alert('請輸入 CSV 並點選 Update 載入資料 !!!');
}

function readCsv(csvFName)
{
	var eventStr =
		'{"time1" : "Event Start Time",' +
		' "time2" : "Event End Time (keep empty if these is no End Time)",' +
		' "Cate"  : "Category",' +
		' "Item"  : "Event",' +
		' "Desc"  : "Description",' +
		' "Base"  : "Put this Event to Base Category"}' ;

	$.get(csvFName, function(data) {
		var evenAry = data.split('\r\n');
		for (var n=1; n<evenAry.length; ++n) {
			var evenData = evenAry[n].split('\t');
			eventStr +=
				',{"time1" : "' + evenData[0] + '",' +
				'  "time2" : "' + evenData[1] + '",' +
				'  "Cate"  : "' + evenData[2] + '",' +
				'  "Item"  : "' + evenData[3] + '",' +
				'  "Desc"  : "' + evenData[4] + '",' +
				'  "Base"  :  ' + ((evenData[5]=='Yes') ? true : false) + '}' ;
		}
		eventStr = '[' + eventStr + ']';

		var timeline = $('#timeline-container').jqTimeline();
		timeline.jqSetTimelineEvent({
			events:       JSON.parse(eventStr),
			firstRowNum:  1
		});
	});
}
