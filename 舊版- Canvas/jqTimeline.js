(function($)
{
	// Global Parameters
	var _param = null;
	var _canvas = {id:'', width:0, height:0, ctx:null, padding:9, drawRect:{top:0, bottom:0, left:0, right:0}};
	var _dateRange = {start: new Date(9999,9,9), end: new Date(1111,1,1)};
	var _gridTextWidth = 70;
	var _gridLwBnd = 20; // min pixel between 2 grid lines
	var _gridLevel = 0; // draw main grid for every _gridLevel years
	var _eventPntRadius = 3;
	var _eventPntWidth = 15;
	var _eventTxtRadius = 10;
	var _eventTxtDistance = 10;
	var _eventTxtFont = '14px Calibri';
	var _gridInfo = [
		{checkStart:new Date(2000,0,1), checkEnd:new Date(3000,0,1 ), nxtDiv:10, desc:'main grid in every 1000 years'},
		{checkStart:new Date(2000,0,1), checkEnd:new Date(2100,0,1 ), nxtDiv:10, desc:'main grid in every 100 years'},
		{checkStart:new Date(2000,0,1), checkEnd:new Date(2010,0,1 ), nxtDiv:10, desc:'main grid in every 10 years'},
		{checkStart:new Date(2000,0,1), checkEnd:new Date(2001,0,1 ), nxtDiv: 4, desc:'main grid in every 1 years'},
		{checkStart:new Date(2000,0,1), checkEnd:new Date(2000,3,1 ), nxtDiv: 3, desc:'main grid in every quaters'},
		{checkStart:new Date(2000,0,1), checkEnd:new Date(2000,1,1 ), nxtDiv: 2, desc:'main grid in every months'},
		{checkStart:new Date(2000,0,1), checkEnd:new Date(2000,0,16), nxtDiv: 5, desc:'main grid in every 1/15 day'},
		{checkStart:new Date(2000,0,1), checkEnd:new Date(2000,0,4 ), nxtDiv: 3, desc:'main grid in every 3 days'},
		{checkStart:new Date(2000,0,1), checkEnd:new Date(2000,0,2 ), nxtDiv: 1, desc:'main grid in every days'}
	];
	var colorMap = null;
	var positionMap = null;

	$.fn.jqTimeline = function()
	{
		// 檢查是否正確使用 DIV 呼叫.
		if (!$(this).is('div')) {
			console.log('ERROR in jqTimeline(): input Object ID is NOT a DIV object!');
			return null;
		}

		// Create Canvas inside DIV
		_canvas.id = $(this).attr('id') + '-canvas';
		_canvas.width  = $(this).width();
		_canvas.height = $(this).height();
		_canvas.drawRect.top    = _canvas.padding;
		_canvas.drawRect.bottom = _canvas.height - _canvas.padding;
		_canvas.drawRect.left   = _canvas.padding;
		_canvas.drawRect.right  = _canvas.width - _canvas.padding;

		$(this).append('<canvas id="' + _canvas.id + '" width="' + _canvas.width + '" height="' + _canvas.height + '"></canvas>');
		_canvas.ctx = document.getElementById(_canvas.id).getContext('2d');

		$(this).bind('mousewheel', handleMouseWheelUp);

		return this;
	};

	$.fn.jqSetTimelineEvent = function(param)
	{
		// set default parameters
		var defParam = {
			firstRowNum: 1,
			baseCategory: 'Base-Timeline'
		};
		_param = $.extend(defParam, param);

		if (_param.events == undefined) {
			console.log('ERROR in jqAddTimelineEvent(): NO event input!');
			return;
		}
		if ((_param.firstRowNum < 0) || (_param.firstRowNum >= _param.events.length)) _param.firstRowNum = 0;

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

		// pre-define colors and positions
		prepareColor();
		preparePosition();

		// start drawing
		$(this).jqRefreshTimeline();
	};

	// 開始繪製時間軸
	// jqRefreshTimeline 可以由外部呼叫, 由 user 控制 refresh
	$.fn.jqRefreshTimeline = function()
	{
		// modify grid level
		modifyGridLevel();
		console.log(_gridInfo[_gridLevel].desc);

		// clear
		_canvas.ctx.clearRect(0, 0, _canvas.width, _canvas.height);

		// draw grid line and text
		drawGrids();

		// draw event point
		drawEventPoint();
		drawEventItems();
	}

	// 畫格線
	function drawGrids()
	{
		var gridDate = findFirstGridDate(_dateRange.start);
		var gridPos = dateToPos(gridDate);
		_gridTextWidth = _canvas.ctx.measureText(gridDateStr(gridDate)).width + 10;

		var blockLeft = _canvas.drawRect.left + _gridTextWidth;
		var blockWidth = _canvas.width - 2 * _canvas.padding - _gridTextWidth;

		// draw grid line
		_canvas.ctx.lineWidth = 1;
		_canvas.ctx.font = '12px Calibri';
		_canvas.ctx.textAlign = 'start';
		_canvas.ctx.textBaseline = 'middle';

		while (gridDate < _dateRange.end)
		{
			_canvas.ctx.fillStyle = 'lightgray';
			_canvas.ctx.fillRect(blockLeft, gridPos, blockWidth, 1);

			_canvas.ctx.fillStyle = 'gray';
			_canvas.ctx.fillText(gridDateStr(gridDate), _canvas.drawRect.left, gridPos);

			gridDate = findNextGridDate(gridDate);
			gridPos = dateToPos(gridDate);
		}
	}

	// 畫 Event 定位點
	function drawEventPoint()
	{
		for (var n=1; n<_param.events.length; ++n)
		{
			var isMainCat = (_param.events[n].Cate == _param.baseCategory);

			var d1 = _param.events[n].time1;
			var d2 = _param.events[n].time2;
			var yPos1 = Math.round(dateToPos(d1));
			var yPos2 = (d2 == null) ? yPos1 : Math.round(dateToPos(d2));
			var textYPos = (yPos1 + yPos2) / 2;
			var xPos = positionMap.get(_param.events[n].Cate);
			var textXPos = xPos + _eventPntWidth;
			var clrHue = colorMap.get(_param.events[n].Cate);
			var clrDark  = 'hsl(' + clrHue + ', 100%, 50%)';
			var clrLight = 'hsl(' + clrHue + ', 100%, 90%)';

			_canvas.ctx.fillStyle = (d2 == null) ? clrDark : clrLight;
			_canvas.ctx.strokeStyle = clrDark;

			canvasRoundRect(xPos, yPos1 - _eventPntRadius, xPos + _eventPntWidth, yPos2 + _eventPntRadius, _eventPntRadius);

			_canvas.ctx.fill();
			_canvas.ctx.stroke();
		}
	}

	// 畫 Event 名稱及說明
	function drawEventItems()
	{
		_canvas.ctx.font = _eventTxtFont;

		for (var n=1; n<_param.events.length; ++n)
		{
			var d1 = _param.events[n].time1;
			var d2 = _param.events[n].time2;
			var text = dateStr(_param.events[n].time1) + ' - ' + _param.events[n].Item;
			var yPos1 = Math.round(dateToPos(d1));
			var yPos2 = (d2 == null) ? yPos1 : Math.round(dateToPos(d2));
			var textYPos = (yPos1 + yPos2) / 2;
			var xPos = positionMap.get(_param.events[n].Cate);
			var textXPos = xPos + _eventPntWidth;
			var textWth = _canvas.ctx.measureText(text).width;
			var clrHue = colorMap.get(_param.events[n].Cate);
			var clrDark = 'hsl(' + clrHue + ', 100%, 50%)';
			var clrText = ((clrHue >=20) && (clrHue<=200)) ? 'black' : 'white';

			_canvas.ctx.fillStyle = clrDark;

			// arrow
			_canvas.ctx.beginPath();
			_canvas.ctx.moveTo(textXPos, textYPos);
			_canvas.ctx.lineTo(textXPos + _eventTxtDistance, textYPos - 3);
			_canvas.ctx.lineTo(textXPos + _eventTxtDistance, textYPos + 3);
			_canvas.ctx.closePath();
			_canvas.ctx.fill();

			// background
			canvasRoundRect(
				textXPos + _eventTxtDistance,                               textYPos - _eventTxtRadius,
				textXPos + _eventTxtDistance + textWth + 2*_eventTxtRadius, textYPos + _eventTxtRadius,
				_eventTxtRadius);
			_canvas.ctx.fill();

			// text
			_canvas.ctx.fillStyle = clrText;
			_canvas.ctx.fillText(text, textXPos + _eventTxtDistance + _eventTxtRadius, textYPos);
		}
	}

	// 畫圓角矩型
	function canvasRoundRect(xPos1, yPos1, xPos2, yPos2, radius)
	{
		_canvas.ctx.beginPath();
		_canvas.ctx.moveTo(xPos1, yPos1 + radius);
		_canvas.ctx.arcTo (xPos1, yPos1, xPos1 + radius, yPos1, radius);
		_canvas.ctx.lineTo(xPos2 - radius, yPos1);
		_canvas.ctx.arcTo (xPos2, yPos1, xPos2, yPos1 + radius, radius);
		_canvas.ctx.lineTo(xPos2, yPos2 - radius);
		_canvas.ctx.arcTo (xPos2, yPos2, xPos2 - radius, yPos2, radius);
		_canvas.ctx.lineTo(xPos1 + radius, yPos2);
		_canvas.ctx.arcTo (xPos1, yPos2, xPos1, yPos2 - radius, radius);
		_canvas.ctx.closePath()
	}

	function handleMouseWheelUp(e)
	{
		var timeDiff = _dateRange.end.getTime() - _dateRange.start.getTime();
		var timeDelta = Math.round(timeDiff / 20);

		if (e.ctrlKey)
		{
			e.preventDefault();
			if (e.originalEvent.wheelDelta > 0)
			{
				_dateRange.start.setTime(_dateRange.start.getTime() + timeDelta);
				_dateRange.end.setTime(  _dateRange.end.getTime()   - timeDelta);
			}else{
				_dateRange.start.setTime(_dateRange.start.getTime() - timeDelta);
				_dateRange.end.setTime(  _dateRange.end.getTime()   + timeDelta);
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

		$(this).jqRefreshTimeline();
	}

	function modifyGridLevel()
	{
		var diff = 0;
		var upBnd = 0;
		var confirm = false;

		while(!confirm)
		{
			diff = dateToPos(_gridInfo[_gridLevel].checkEnd) - dateToPos(_gridInfo[_gridLevel].checkStart);
			upBnd = _gridLwBnd * _gridInfo[_gridLevel].nxtDiv;

			if (diff > upBnd)
			{
				if (_gridLevel >= _gridInfo.length - 1) {
					_gridLevel = _gridInfo.length - 1;
					confirm = true;
				}else{
					_gridLevel += 1;
				}
			}
			else if (diff < _gridLwBnd)
			{
				if (_gridLevel <= 0) {
					_gridLevel = 0;
					confirm = true;
				}else{
					_gridLevel -= 1;
				}
			}
			else confirm = true;
		}
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
				returnDate = _currDate;
				break;
		}

		return returnDate;
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
				returnDate = _prevGridDate.addDays(3);
				break;
			case 8: // main grid in every days
				returnDate = _prevGridDate.addDays(1);
				break;
		}

		return returnDate;
	}

	function dateToPos(_tarDate)
	{
		var d1 = _tarDate - _dateRange.start;
		var d2 = _dateRange.end - _dateRange.start;
		var h2 = _canvas.drawRect.bottom - _canvas.drawRect.top;

		return _canvas.drawRect.top + h2 * d1 / d2;
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
			str = y;
			break;
		case 4:
		case 5:
			str = y + '-' + m;
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

		var hueDif = 360 / colorMap.size;
		//var hueStart = Math.floor(Math.random() * hueDif);
		var hueStart = 0;
		for (const cat of colorMap.keys()) 
		{
			colorMap.set(cat, hueStart);
			hueStart += hueDif;
		}
	}

	function preparePosition()
	{
		positionMap = new Map();

		for (var n=1; n<_param.events.length; ++n)
		{
			if (positionMap.has(_param.events[n].Cate)) continue;
			positionMap.set(_param.events[n].Cate, 0);
		}

		var n = 1;
		var posDif = (_canvas.width - 2 * _canvas.padding - _gridTextWidth) / positionMap.size;
		var posStart = _canvas.drawRect.left + _gridTextWidth;
		for (const cat of positionMap.keys())
		{
			if (cat == _param.baseCategory) positionMap.set(cat, posStart);
			else							positionMap.set(cat, posStart + posDif * (n++));
		}
	}
})(jQuery);
