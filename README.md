本程式可以根據 CSV 檔內容畫出年表. 並依事件類別分類.

CSV 格式如下:

| 欄位名稱     | 說明                                                      |
| ----------- |-----------------------------------------------------------|
| Time1       | 事件發生時間 (yyyy/mm/dd, 不可省略)                         |
| Time2       | 事件結束時間 (yyyy/mm/dd, 可省略, 若事件未結束, 可輸入 TBD)  |
| Category    | 事件類別                                                   |
| Item        | 事件標題                                                   |
| Description | 事件說明 (目前還沒有畫上去)                                 |
| IsBase      | 是否強制畫在最左側 (Yes / No)                               |
