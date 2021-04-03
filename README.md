# 歡迎使用 jqTimeline.js - 一個用來畫時代年表的 jQuery plugin

** jqTimeline.js 可以根據 JSON 內容畫出年表. 並依事件類別分類. **

## 說明
jqTimeline.js 可以在 <DIV> 中畫出年表. 使用者透過 JSON 格式將事件內容加入後, jqTimeline.js 會自動產生對應的年表圖, 同時加入捲動及縮放功能.

## 使用方式
```
<html>
    <body>
        <div id="timeline-container"></div>
    </body>
</html>
<script>
	var eventStr =
		'[ { "time1" : "Event Start Time",                  ' +
		'    "time2" : "Event End Time",                    ' +
		'    "Cate"  : "Category",                          ' +
		'    "Item"  : "Event",                             ' +
		'    "Desc"  : "Description",                       ' +
		'    "Base"  : "Put this Event to Base Category"    ' +
		'  },                                               ' +
		'  { "time1" : "2021/01/01",                        ' +
		'    "time2" : "",                                  ' +
		'    "Cate"  : "Festival",                          ' +
		'    "Item"  : "2021 New Year",                     ' +
		'    "Desc"  : "2021 New Year",                     ' +
		'    "Base"  : "No"                                 ' +
		'  }                                                ' +
		']                                                  ' ;

		var timeline = $('#timeline-container').jqTimeline();
		timeline.jqSetTimelineEvent({
			events:       JSON.parse(eventStr),
			firstRowNum:  1
		});
</script>
```

## JSON 欄位說明
| **欄位名稱** | **說明**                                              |
| ------------|------------------------------------------------------|
| time1       | 事件發生時間 (yyyy/mm/dd, 不可省略)                      |
| time2       | 事件結束時間 (yyyy/mm/dd, 可省略, 若事件未結束, 可輸入 TBD) |
| Cate        | 事件類別                                               |
| Item        | 事件標題                                               |
| Desc        | 事件說明 (目前還沒有畫上去)                               |
| Base        | 是否強制畫在最左側 (Yes / No)                            |
