# jqTimeline.js - 一個用來畫時代年表的 jQuery plugin

** jqTimeline.js 可以根據 JSON 內容畫出年表. 並依事件類別分類. **

## 說明
jqTimeline.js 可以在 HTML 的 &lt;DIV&gt; 元件中利用 &lt;SVG&gt; 元件畫出年表. 使用者透過 JSON 格式將事件內容加入後, jqTimeline.js 會自動產生對應的年表圖, 同時加入捲動及縮放功能.

## 檔案內容
| **檔案名稱**     | **說明**                        |
| ----------------|--------------------------------|
| jqTimeline.js   | jqTimeline.js 主程式            |
| jqTimeline.css  | jqTimeline.js 對應的 CSS 檔     |
| TimeLine.html   | HTML 範例程式                   |
| main.js         | 呼叫 jqTimeline.js 範例         |

## 範例程操作說明
1. 上方輸入框輸入 CSV 檔網址, 或直在網址列使用 ?csv=xxx 載入 CSV
1. 點選輸入框右方的 Update 按鈕, 即可畫出年表.
1. Click 事件區塊, 可將該區塊放大至全畫面.
1. 滾動滑鼠滾輪, 可捲動年表.
1. 按著 Shift 並滾動滑鼠滾輪, 可慢速捲動年表.
1. 按著 Ctrl 並滾動滑鼠滾輪, 可縮放年表.
1. 按著 Shift+Ctrl 並滾動滑鼠滾輪, 可慢速縮放年表.

## Source Code Example
```
<html>
    <body>
        <div id="timeline-container"></div>
    </body>
</html>
<script>
    var eventJson =
        [ { "time1" : "Event Start Time",
            "time2" : "Event End Time",
            "Cate"  : "Category",
            "Item"  : "Event",
            "Desc"  : "Description",
            "Base"  : "Put this Event to Base Category"
          },
          { "time1" : "2021/01/01",
            "time2" : "",
            "Cate"  : "Festival",
            "Item"  : "2021 New Year",
            "Desc"  : "2021 New Year",
            "Base"  : "No"
          }
        ];

        var timeline = $('#timeline-container').jqTimeline();
        timeline.jqSetTimelineEvent({
            events: eventJson,
            firstRowNum: 1
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
