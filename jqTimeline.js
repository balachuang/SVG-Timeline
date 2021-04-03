(function($)
{
	// Global Parameters
	var _param = null;
	var _svgObj = null;
	var _svgMaskObj = null;
	var _svgGridMainObj = null;
	var _svgGridSubsObj = null;
	var _svgEventBlockObj = null;
	var _svgEventPointObj = null;
	var _svg = {pageX:0, pageY:0, width:0, height:0, padding:9, drawRect:{top:0, bottom:0, left:0, right:0}};
	var _dateRange = {	start:      new Date(9999,9,9), end:      new Date(1111,1,1),
						eventStart: new Date(9999,9,9), eventEnd: new Date(1111,1,1)};
	var _maxDayRange = 10000 * 365 * 86400 * 1000; // 10,000 years
	var _minDayRange =     7 * 86400 * 1000;       // 7 days years
	var _gridLwBnd = 25; // min pixel between 2 grid lines
	var _gridLevel = 0; // draw main grid for every _gridLevel years
	var _eventPntRadius = 3;
	var _eventPntWidth = 15;
	var _eventTxtRadius = 10;
	var _eventTxtDistance = 10;
	var _eventTxtFont = '14px Calibri';
	var _gridInfo = [
		{checkStart:new Date(2000,0,1), checkEnd:new Date(3000,0,1 ), nxtDiv:10, days:365000, desc:'main grid in every 1000 years'},
		{checkStart:new Date(2000,0,1), checkEnd:new Date(2100,0,1 ), nxtDiv:10, days: 36500, desc:'main grid in every  100 years'},
		{checkStart:new Date(2000,0,1), checkEnd:new Date(2010,0,1 ), nxtDiv:10, days:  3650, desc:'main grid in every   10 years'},
		{checkStart:new Date(2000,0,1), checkEnd:new Date(2001,0,1 ), nxtDiv: 4, days:   365, desc:'main grid in every    1 years'},
		{checkStart:new Date(2000,0,1), checkEnd:new Date(2000,3,1 ), nxtDiv: 3, days:    90, desc:'main grid in every quaters'},
		{checkStart:new Date(2000,0,1), checkEnd:new Date(2000,1,1 ), nxtDiv: 2, days:    30, desc:'main grid in every months'},
		{checkStart:new Date(2000,0,1), checkEnd:new Date(2000,0,16), nxtDiv: 5, days:    15, desc:'main grid in every 1/15 day'},
		{checkStart:new Date(2000,0,1), checkEnd:new Date(2000,0,4 ), nxtDiv: 3, days:     3, desc:'main grid in every 3 days'},
		{checkStart:new Date(2000,0,1), checkEnd:new Date(2000,0,2 ), nxtDiv: 1, days:     1, desc:'main grid in every days'}
	];
	var colorMap = null;
	var _categoryRank = null;

	$.fn.jqTimeline = function()
	{
		// 檢查是否正確使用 DIV 呼叫.
		if (!$(this).is('div')) {
			console.log('ERROR in jqTimeline(): input Object ID is NOT a DIV object!');
			return null;
		}
		$(this).css({overflow:'hidden'});

		// reset all data
		$(this).html('');
		_param = null;

		// Create SVG block inside DIV
		_svg.pageX  = $(this).position().left;
		_svg.pageY  = $(this).position().top;
		_svg.width  = $(this).width();
		_svg.height = $(this).height();
		_svg.drawRect.top    = _svg.padding;
		_svg.drawRect.bottom = _svg.height - _svg.padding;
		_svg.drawRect.left   = _svg.padding;
		_svg.drawRect.right  = _svg.width - _svg.padding;

		_svgObj = makeSVG('svg', {width: _svg.width, height: _svg.height, class:'jqtl-svg'});
		_svgMaskObj = makeSVG('g', {});
		_svgGridMainObj = makeSVG('g', {});
		_svgGridSubsObj = makeSVG('g', {});
		_svgEventBlockObj = makeSVG('g', {});
		_svgEventPointObj = makeSVG('g', {});

		$(this).append(_svgObj);
		_svgObj.append(_svgGridSubsObj);
		_svgObj.append(_svgGridMainObj);
		_svgObj.append(_svgMaskObj);
		_svgObj.append(_svgEventBlockObj);
		_svgObj.append(_svgEventPointObj);

		$(this).bind('mousewheel', handleMouseWheelScroll);

		return this;
	};

	$.fn.jqSetTimelineEvent = function(param)
	{
		// set default parameters
		var defParam = {
			firstRowNum: 1
		};
		_param = $.extend(defParam, param);

		if (_param.events == undefined) {
			console.log('ERROR in jqAddTimelineEvent(): NO event input!');
			return;
		}
		if ((_param.firstRowNum < 0) || (_param.firstRowNum >= _param.events.length)) _param.firstRowNum = 0;

		// reset date range.
		_dateRange.start = new Date(9999,9,9);
		_dateRange.end   = new Date(1111,1,1);
		_dateRange.eventStart = new Date(9999,9,9);
		_dateRange.eventEnd   = new Date(1111,1,1);

		// prepare event content
		for (var n=_param.firstRowNum; n<_param.events.length; ++n)
		{
			var logStr = '';

			// check time1
			if (_param.events[n].time1 === '') {
				console.log('ERROR in ' + n + '-th timeline event: WRING time1 format!');
				continue;
			}
			logStr = '[' + _param.events[n].time1 + ']-';
			var _time1 = _param.events[n].time1.split('/');
			_param.events[n].time1 = new Date(_time1[0], _time1[1] - 1, _time1[2]);

			if (_dateRange.start > _param.events[n].time1) _dateRange.start.setTime(_param.events[n].time1.getTime());
			if (_dateRange.end   < _param.events[n].time1) _dateRange.end.setTime(  _param.events[n].time1.getTime());

			// check time2
			if (_param.events[n].time2 === '') {
				logStr += '[          ] ';
				_param.events[n].time2 = null;
			} else if(_param.events[n].time2 === 'TBD') {
				logStr += '[ On-Going ] ';
				_param.events[n].time2 = new Date();

				if (_dateRange.start > _param.events[n].time2) _dateRange.start.setTime(_param.events[n].time2.getTime());
				if (_dateRange.end   < _param.events[n].time2) _dateRange.end.setTime(  _param.events[n].time2.getTime());
			} else {
				logStr += '[' + _param.events[n].time2 + '] ';
				var _time2 = _param.events[n].time2.split('/');
				_param.events[n].time2 = new Date(_time2[0], _time2[1] - 1, _time2[2]);

				if (_dateRange.start > _param.events[n].time2) _dateRange.start.setTime(_param.events[n].time2.getTime());
				if (_dateRange.end   < _param.events[n].time2) _dateRange.end.setTime(  _param.events[n].time2.getTime());
			}

			//
			logStr += _param.events[n].Cate + ':' + _param.events[n].Item;
			console.log('Read: ' + logStr);
		}

		//
		_dateRange.eventStart.setTime(_dateRange.start.getTime());
		_dateRange.eventEnd.setTime(_dateRange.end.getTime());

		// pre-define colors and positions
		prepareColor();
		prepareCateXPos();

		// start drawing
		$(this).jqRefreshTimeline();
	};

	// 開始繪製時間軸
	// jqRefreshTimeline 可以由外部呼叫, 由 user 控制 refresh
	$.fn.jqRefreshTimeline = function()
	{
		// modify grid level
		var glevelChanged = modifyGridLevel();
		console.log(_gridInfo[_gridLevel].desc);

		// clear gridlines
		_svgMaskObj.innerHTML = '';
		_svgGridMainObj.innerHTML = '';
		_svgGridSubsObj.innerHTML = '';
		_svgEventBlockObj.innerHTML = '';
		_svgEventPointObj.innerHTML = '';

		// draw grid line and text
		var gridXStart = drawGridLines(glevelChanged);

		// draw mask
		drawMask(gridXStart);

		// draw event point
		drawEvents(gridXStart);
	}

	// 畫格線, 和 Canvas 版一樣全部重畫
	// 同時畫 sub-gridline, 因為會參考到文字寛度
	function drawGridLines(gridLvlChanged)
	{
		// =============== 畫格線
		var gridDate = findFirstGridDate(_dateRange.start);
		var gridPos = dateToPos(gridDate);

		// pre-calculate text size
		var tmp = makeSVG('text', {x:0, y:-10, class:'jqtl-grid-text'});
		tmp.append(gridDateStr(gridDate));
		_svgGridMainObj.append(tmp);
		var txtbox = tmp.getBBox();

		// 格線標記的區塊參數, 計算方法參考 design.pptx
		var txtXPad = 15;
		var txtYPad = 3;
		var txtw = txtbox.width + 3 * txtXPad;
		var txth = txtbox.height + 2 * txtYPad;
		var shrink = txtw / 5;
		var fillet = .5;
		var alpha = 1 - fillet * shrink / Math.sqrt(shrink*shrink + txth*txth);
		var xdiff = alpha * shrink;
		var ydiff = alpha * txth;

		while (true)
		{
			// add back lbock and line
			var bbxPath = ' M' + _svg.drawRect.left + ' ' + gridPos +
						  ' L' + _svg.drawRect.left + ' ' + (gridPos - txth) +
						  ' L' + (_svg.drawRect.left + txtw - shrink - shrink*fillet) + ' ' + (gridPos - txth) +
						  ' Q' + (_svg.drawRect.left + txtw - shrink) + ' ' + (gridPos - txth) + ',' + (_svg.drawRect.left + txtw - xdiff) + ' ' + (gridPos - ydiff) +
						  ' L' + (_svg.drawRect.left + txtw) + ' ' + gridPos +
						  ' L' + _svg.drawRect.right + ' ' + gridPos +
						  ' Z';
			var bbx = makeSVG('path', {d:bbxPath, class:'jqtl-grid-mainline'});
			_svgGridMainObj.append(bbx);

			// add text
			var txt = makeSVG('text', {x:_svg.drawRect.left + txtXPad, y:gridPos - txtYPad * 2, class:'jqtl-grid-text'});
			txt.append(gridDateStr(gridDate));
			_svgGridMainObj.append(txt);

			if (gridDate > _dateRange.end) break;

			gridDate = findNextGridDate(gridDate);
			gridPos = dateToPos(gridDate);
		}

		// =============== 畫格線: Part-II - Sub-Gridline
		gridDate = findFirstGridDateInNextLevel(_dateRange.start);
		gridPos = dateToPos(gridDate);

		var xStart = _svg.drawRect.left + txtw;
		tmp = makeSVG('line', {x1:xStart, y1:-10, x2:xStart, y2:_svg.drawRect.bottom, class:'jqtl-grid-subline'});
		_svgGridSubsObj.prepend(tmp);
		tmp = makeSVG('line', {x1:_svg.drawRect.right, y1:-10, x2:_svg.drawRect.right, y2:_svg.drawRect.bottom, class:'jqtl-grid-subline'});
		_svgGridSubsObj.prepend(tmp);
		while (true)
		{
			// add line
			tmp = makeSVG('line', {x1:xStart, y1:gridPos, x2:_svg.drawRect.right, y2:gridPos, class:'jqtl-grid-subline'});
			_svgGridSubsObj.prepend(tmp);

			if (gridDate > _dateRange.end) break;

			gridDate = findNextGridDateInNextLevel(gridDate);
			gridPos = dateToPos(gridDate);
		}

		// 回傳開始畫格線的位置
		return xStart;
	}

	// 把沒有事件的地方畫上底色
	function drawMask(xStart)
	{
		var gridPosS = dateToPos(_dateRange.eventStart);
		var gridPosE = dateToPos(_dateRange.eventEnd);
		var maskWidth = _svg.drawRect.right - xStart;

		var sm = makeSVG('rect', {class:'jqtl-mask', x:xStart, y:-10,      width:maskWidth, height:gridPosS + 10   });
		var em = makeSVG('rect', {class:'jqtl-mask', x:xStart, y:gridPosE, width:maskWidth, height:_svg.height + 10});
		_svgMaskObj.append(sm);
		_svgMaskObj.append(em);
	}

	// 畫 Event 定位點
	function drawEvents(xStart)
	{
		var catMargin = 5;
		var catWidth = (_svg.drawRect.right - xStart) / (_categoryRank.size + 1);
		var eventRectWidth = catWidth - 2 * catMargin;
		var eventRectRound = 0;
		var eventPointRadius = 7;
		var eventPointTextHeight = 20;
		var eventPointTextOffset = 30;

		// initial min YPos of each category
		var minY = Math.max(Math.round(dateToPos(_dateRange.start)), 0);
		var categoryMaxTextY = new Map();
		for (const cat of _categoryRank.keys()) categoryMaxTextY[cat] = minY;
		categoryMaxTextY['Base'] = minY;

		for (var n=1; n<_param.events.length; ++n)
		{
			// 檢查起始時間超過目前繪圖區最大時間
			var d1 = _param.events[n].time1;
			if (d1 > _dateRange.end) continue;

			// 檢查結束時間不到目前繪圖區最小時間
			var d2 = _param.events[n].time2;
			if ((d2 != null) && (d2 < _dateRange.start)) continue;
			if ((d2 == null) && (d1 < _dateRange.start)) continue;

			var catRank = _param.events[n].Base ? 0 : _categoryRank.get(_param.events[n].Cate);
			var yPos = Math.round(dateToPos(d1));
			var clrHue = colorMap.get(_param.events[n].Cate);
			var clrDark  = 'hsl(' + clrHue + ', 100%, 50%)';
			var clrLight = 'hsl(' + clrHue + ', 100%, 90%)';

			var go = makeSVG('g', {});
			if (d2 == null)
			{

				// 畫圓點
				var xPos = xStart + catRank * catWidth + catWidth / 3;
				var vo = makeSVG(	'circle',
									{id : 'jqtl-eventpoint-' + n,
									 cx : xPos,
									 cy : yPos,
									 r  : eventPointRadius,
									 class : 'jqtl-grid-event-point',
									 style : 'fill:' + clrDark + ';'});

				// 寫字
				var txtXPos = xPos + eventPointTextOffset;
				var txtYPos = yPos - eventPointTextHeight;
				var txtWidth = 2 * catWidth / 3 - eventPointTextOffset - catMargin;
				if (txtYPos < categoryMaxTextY[_param.events[n].Cate])
				{
					txtYPos = categoryMaxTextY[_param.events[n].Cate];
					categoryMaxTextY[_param.events[n].Cate] += eventPointTextHeight;
				}else{
					categoryMaxTextY[_param.events[n].Cate] = txtYPos + eventPointTextHeight;
				}
				go.append(makeSVG(	'line',
									{x1:xPos,
									 y1:yPos,
									 x2:txtXPos + 2,
									 y2:txtYPos + eventPointTextHeight - 3,
									 style:'stroke:'+clrDark, class:'jqtl-grid-event-textline'}));

				var fo = makeSVG('foreignObject', {	x: txtXPos, y: txtYPos,
													style:'width:' + txtWidth + 'px; height:' + eventPointTextHeight + 'px;'});
				var tt = makeForeignObject('div', {	style:	'background-color:' + clrLight + '; ' +
															'border-color:' + clrDark + '; ' +
															'width:' + (txtWidth-7) + 'px; '+
															'height:' + (eventPointTextHeight-1) + +'px;',
													class:'jqtl-grid-eventpoint-text-div'});
				tt.innerHTML = _param.events[n].Item;

				fo.append(tt);
				go.append(fo);
				go.append(vo); // put point on the top
				_svgEventPointObj.append(go);
			}else{
				// 畫區塊
				var xPos = xStart + catRank * catWidth + catMargin;
				var markHeight = Math.round(dateToPos(d2)) - yPos;
				go.append(makeSVG(	'rect',
									{id : 'jqtl-eventblock-' + n,
									 x  : xPos,
									 y  : yPos,
									 width  : eventRectWidth,
									 height : markHeight,
									 rx : eventRectRound,
									 ry : eventRectRound,
									 class : 'jqtl-grid-event-block',
									 style : 'fill:' + clrLight + '; stroke:' + clrDark + ';'}));

				// 寫字, 多一次處理讓字不會因為在區塊中間而跑出畫面
				yPos = (yPos > 0) ? yPos : 0;
				markHeight = (d2 > _dateRange.end) ? Math.round(dateToPos(_dateRange.end)) : Math.round(dateToPos(d2));
				markHeight = markHeight - yPos;

				var fo = makeSVG('foreignObject', {	x:xPos, y:yPos, width:eventRectWidth, height:markHeight});
				var tt = makeForeignObject('div', { class:'jqtl-grid-eventrect-text-div', style:'height:' + markHeight + 'px;'});
				tt.innerHTML = _param.events[n].Item;

				fo.append(tt);
				go.append(fo);
				_svgEventBlockObj.append(go);
			}
		}

		// add event handler
		$('.jqtl-grid-event-point, .jqtl-grid-event-block').mouseenter(function(){
			moveSvgToTop($(this));
		});
		$('.jqtl-grid-event-point, .jqtl-grid-event-block').click(function(){
			zoomInToEvent($(this));
		});
	}

	// mouse wheel event handler
	function handleMouseWheelScroll(e)
	{
		// 計算要變化的時間長度
		var timeDiff = _dateRange.end.getTime() - _dateRange.start.getTime();
		var timeDelta = Math.round(timeDiff / 10);

		if (e.shiftKey) timeDelta /= 10;

		// 計算以目前游標為中心的上下變化
		var h1 = e.pageY - _svg.pageY;
		var h2 = _svg.pageY + _svg.height - e.pageY;
		var timeDelta1 = timeDelta * h1 / _svg.height;
		var timeDelta2 = timeDelta * h2 / _svg.height;

		if (e.ctrlKey)
		{
			e.preventDefault();
			if (e.originalEvent.wheelDelta > 0)
			{
				if (timeDiff > _minDayRange)
				{
					//_dateRange.start.setTime( _dateRange.start.getTime() + timeDelta / 2);
					//_dateRange.end.setTime(   _dateRange.end.getTime()   - timeDelta / 2);
					_dateRange.start.setTime( _dateRange.start.getTime() + timeDelta1);
					_dateRange.end.setTime(   _dateRange.end.getTime()   - timeDelta2);
				}
			}else{
				if (timeDiff < _maxDayRange)
				{
					_dateRange.start.setTime( _dateRange.start.getTime() - timeDelta1);
					_dateRange.end.setTime(   _dateRange.end.getTime()   + timeDelta2);
				}
			}
		}else{
			if (e.originalEvent.wheelDelta > 0)
			{
				_dateRange.start.setTime(_dateRange.start.getTime() - timeDelta);
				_dateRange.end.setTime(  _dateRange.end.getTime()   - timeDelta);
			}else{
				_dateRange.start.setTime(_dateRange.start.getTime() + timeDelta);
				_dateRange.end.setTime(  _dateRange.end.getTime()   + timeDelta);
			}
		}
//		console.log('from: ' + _dateRange.start);
//		console.log('  to: ' + _dateRange.end);

		$(this).jqRefreshTimeline();
	}

	// 依照日期區間找出最佳 gridline level
	function modifyGridLevel()
	{
		var diff = 0;
		var upBnd = 0;
		var confirm = false;

		var newGridLevel = _gridLevel;
		while(!confirm)
		{
			diff = dateToPos(_gridInfo[newGridLevel].checkEnd) - dateToPos(_gridInfo[newGridLevel].checkStart);
			upBnd = _gridLwBnd * _gridInfo[newGridLevel].nxtDiv;

			if (diff > upBnd)
			{
				if (newGridLevel >= _gridInfo.length - 1) {
					newGridLevel = _gridInfo.length - 1;
					confirm = true;
				}else{
					newGridLevel += 1;
				}
			}
			else if (diff < _gridLwBnd)
			{
				if (newGridLevel <= 0) {
					newGridLevel = 0;
					confirm = true;
				}else{
					newGridLevel -= 1;
				}
			}
			else confirm = true;
		}

		if (newGridLevel == _gridLevel) return false;

		// return true if grid level changed
		_gridLevel = newGridLevel;
		return true;
	}

	function findFirstGridDateInNextLevel(_currDate)
	{
		var rtn = null;

		if (_gridLevel == 8)
		{
			rtn = new Date(_currDate.getTime());
		}else{
			_gridLevel += 1;
			rtn = findFirstGridDate(_currDate);
			rtn.setDate(rtn.getDate() - _gridInfo[_gridLevel].days);
			_gridLevel -= 1;
		}

		return rtn;
	}

	function findFirstGridDate(_currDate)
	{
		var returnDate = null;
		var y = _currDate.getFullYear();
		var m = _currDate.getMonth();
		var d = _currDate.getDate();

		switch(_gridLevel)
		{
			case 0: // main grid in every 1000 years
				if ((d == 1) && (m == 0) && (y % 1000 == 0)) returnDate = _currDate;
				else {
					y = 1000 * Math.ceil(y / 1000);
					returnDate = new Date(y, 0, 1);
				}
				break;
			case 1: // main grid in every 100 years
				if ((d == 1) && (m == 0) && (y % 100 == 0)) returnDate = _currDate;
				else {
					y = 100 * Math.ceil(y / 100);
					returnDate = new Date(y, 0, 1);
				}
				break;
			case 2: // main grid in every 10 years
				if ((d == 1) && (m == 0) && (y % 10 == 0)) returnDate = _currDate;
				else {
					y = 10 * Math.ceil(y / 10);
					returnDate = new Date(y, 0, 1);
				}
				break;
			case 3: // main grid in every 1 years
				if ((d == 1) && (m == 0)) returnDate = _currDate;
				else					  returnDate = new Date(y+1, 0, 1);
				break;
			case 4: // main grid in every quaters
				if ((d == 1) && (m % 3 == 0)) returnDate = _currDate;
				else
				{
					m = 3 * Math.floor((m + 3) / 3);
					returnDate = new Date(y, m, 1);
				}
				break;
			case 5: // main grid in every months
				if (d == 1) returnDate = _currDate;
				else		returnDate = new Date(y, m+1, 1);
				break;
			case 6: // main grid in every 1/15 day
				if      (d == 1)  returnDate = _currDate;
				else if (d <= 15) returnDate = new Date(y, m, 15);
				else			  returnDate = new Date(y, m+1, 1);
				break;
			case 7: // main grid in every 3 days
			case 8: // main grid in every days
				// 不能直接用 currentDate, 因為 currentDate 有時間, 當 gridLevel 是一天的時候會畫錯
				returnDate = new Date(y, m, d);
				break;
		}

		return returnDate;
	}

	function findNextGridDateInNextLevel(_prevGridDate)
	{
		var rtn = null;

		if (_gridLevel == 8)
		{
			rtn = new Date(_prevGridDate.getTime());
			rtn.setDate(_prevGridDate.getDate() + 1);
		}else{
			_gridLevel += 1;
			rtn = findNextGridDate(_prevGridDate)
			_gridLevel -= 1;
		}

		return rtn;
	}

	function findNextGridDate(_prevGridDate)
	{
		var returnDate = null;
		var y = _prevGridDate.getFullYear();
		var m = _prevGridDate.getMonth();
		var d = _prevGridDate.getDate();

		switch(_gridLevel)
		{
			case 0: // main grid in every 1000 years
				returnDate = new Date(y+1000, 0, 1);
				break;
			case 1: // main grid in every 100 years
				returnDate = new Date(y+100, 0, 1);
				break;
			case 2: // main grid in every 10 years
				returnDate = new Date(y+10, 0, 1);
				break;
			case 3: // main grid in every 1 years
				returnDate = new Date(y+1, 0, 1);
				break;
			case 4: // main grid in every quaters
				switch (m)
				{
					case 0:
					case 3:
					case 6:
						returnDate = new Date(y, m+3, 1);
						break;
					case 9:
						returnDate = new Date(y+1, 0, 1);
						break;
				}
				break;
			case 5: // main grid in every months
				if (m < 11) returnDate = new Date(y, m+1, 1);
				else		returnDate = new Date(y+1, 0, 1);
				break;
			case 6: // main grid in every 1/15 day
				if (d < 15) returnDate = new Date(y, m, 15);
				else		returnDate = new Date(y, m+1, 1);
				break;
			case 7: // main grid in every 3 days
				returnDate = new Date(y, m, d);
				returnDate.setDate(_prevGridDate.getDate() + 3)
				break;
			case 8: // main grid in every days
				returnDate = new Date(y, m, d);
				returnDate.setDate(_prevGridDate.getDate() + 1)
				break;
		}

		return returnDate;
	}

	function dateToPos(_tarDate)
	{
		var d1 = _tarDate - _dateRange.start;
		var d2 = _dateRange.end - _dateRange.start;
		var h2 = _svg.drawRect.bottom - _svg.drawRect.top;

		return _svg.drawRect.top + h2 * d1 / d2;
	}

	function dateStr(_tarDate)
	{
		var y = _tarDate.getFullYear();
		var m = ('0' + (_tarDate.getMonth() + 1)).slice(-2);
		var d = ('0' + (_tarDate.getDate())).slice(-2);

		return y + '-' + m + '-' + d;
	}

	function gridDateStr(_tarDate)
	{
		var y = _tarDate.getFullYear();
		var m = ('0' + (_tarDate.getMonth() + 1)).slice(-2);
		var d = ('0' + (_tarDate.getDate())).slice(-2);

		var str = '';
		switch(_gridLevel)
		{
		case 0:
		case 1:
		case 2:
		case 3:
			str = '西元 ' + y + ' 年';
			break;
		case 4:
		case 5:
			str = '西元 ' + y + ' 年 ' + m + ' 月';
			break;
		case 6:
		case 7:
		case 8:
			str = y + '-' + m + '-' + d;
			break;
		}

		return str;
	}

	function prepareColor()
	{
		colorMap = new Map();

		for (var n=1; n<_param.events.length; ++n)
		{
			if (colorMap.has(_param.events[n].Cate)) continue;
			colorMap.set(_param.events[n].Cate, 0);
		}

		var hueDif = 300 / colorMap.size;
		var hueStart = 120;
		for (const cat of colorMap.keys()) 
		{
			colorMap.set(cat, hueStart);
			hueStart = (hueStart + hueDif) % 360;
		}
	}

	// 預先決定每個 category 排序
	function prepareCateXPos()
	{
		_categoryRank = new Map();

		for (var n=1; n<_param.events.length; ++n)
		{
			if (_param.events[n].Base) continue; // Base Item 固定排在最左邊
			if (_categoryRank.has(_param.events[n].Cate)) continue;
			_categoryRank.set(_param.events[n].Cate, 0);
		}

		var n = 1;
		for (const cat of _categoryRank.keys()) _categoryRank.set(cat, n++);
	}

	function moveSvgToTop(svgObj)
	{
		var sg = svgObj.closest('g');
		var sp = sg.parent('g');
		sp.append(sg);
	}

	function zoomInToEvent(eventObj)
	{
		var objId = eventObj.attr('id');
		var eventId = objId.split('-');
		eventId = eval(eventId[eventId.length - 1]);

		if (_param.events[eventId].time2 == null)
		{
			var y = _param.events[eventId].time1.getFullYear();
			_dateRange.start = new Date(y, 0,  1);
			_dateRange.end   = new Date(y, 11, 1);
		}else{
			_dateRange.start.setTime(_param.events[eventId].time1.getTime());
			_dateRange.end.setTime(  _param.events[eventId].time2.getTime());
		}

		$(this).jqRefreshTimeline();
	}

	function makeSVG(tag, attrs) {
		var el= document.createElementNS('http://www.w3.org/2000/svg', tag);
		for (var k in attrs) el.setAttribute(k, attrs[k]);
		return el;
	}

	function makeForeignObject(tag, attrs) {
		var el= document.createElementNS('http://www.w3.org/1999/xhtml', tag);
		for (var k in attrs) el.setAttribute(k, attrs[k]);
		return el;
	}
})(jQuery);
