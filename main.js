var timeline = null;

$(document).ready(function(){
	var params = location.search;
	if (params.length > 0)
	{
		params = params.substring(1).split('&');
		params.forEach(param => {
			var kv = param.split('=');
			if (kv[0] == 'csv') $('#csv-fname').val(decodeURIComponent(kv[1]));
		});
	}

	timeline = $('#timeline-container').jqTimeline();

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
	var eventJsonAry = [{
		"time1" : "Event Start Time",
		"time2" : "Event End Time (keep empty if these is no End Time)",
		"Cate"  : "Category",
		"Item"  : "Event",
		"Desc"  : "Description",
		"Base"  : "Put this Event to Base Category"
	}];

	$.get(csvFName, function(data) {
		var evenAry = data.split('\r\n');
		for (var n=1; n<evenAry.length; ++n) {
			var evenData = evenAry[n].split('\t');
			var eventJson = {
				"time1" : evenData[0],
				"time2" : evenData[1],
				"Cate"  : evenData[2],
				"Item"  : evenData[3],
				"Desc"  : evenData[4],
				"Base"  : ((evenData[5]=='Yes') ? true : false)
			};
			eventJsonAry.push(eventJson);
		}

		timeline.jqSetTimelineEvent({
			events:       eventJsonAry,
			firstRowNum:  1
		});
	});
}
