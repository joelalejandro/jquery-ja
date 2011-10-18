(function($) {
	/***
	 * Extending JavaScript's Date.parse to allow for DD/MM/YYYY (non-US formatted dates)
	 *
	 * @url    http://stackoverflow.com/questions/3003355/extending-javascripts-date-parse-to-allow-for-dd-mm-yyyy-non-us-formatted-date
	 * @author Campbeln
	 */
	(function() {
	    var fDateParse = Date.parse;

	    Date.parse = function(sDateString) {
	        var a_sLanguage = ['en','en-us'],
	            a_sMatches = null,
	            sCurrentLanguage,
	            dReturn = null,
	            i
	        ;

	            //#### Traverse the a_sLanguages (as reported by the browser)
	        for (i = 0; i < a_sLanguage.length; i++) {
	                //#### Collect the .toLowerCase'd sCurrentLanguage for this loop
	            sCurrentLanguage = (a_sLanguage[i] + '').toLowerCase();

	                //#### If this is the first English definition
	            if (sCurrentLanguage.indexOf('en') == 0) {
	                    //#### If this is a definition for a non-American based English (meaning dates are "DD MM YYYY")
	                if (sCurrentLanguage.indexOf('en-us') == -1 &&      // en-us = English (United States) + Palau, Micronesia
	                    sCurrentLanguage.indexOf('en-ca') == -1 &&      // en-ca = English (Canada)
	                    sCurrentLanguage.indexOf('en-ph') == -1 &&      // en-ph = English (Philippians)
	                    sCurrentLanguage.indexOf('en-bz') == -1         // en-bz = English (Belize)
	                ) {
	                        //#### Setup a oRegEx to locate "## ## ####" (allowing for any sort of delimiter except a '\n') then collect the a_sMatches from the passed sDateString
	                    var oRegEx = new RegExp("(([0-9]{2}|[0-9]{1})[^0-9]*?([0-9]{2}|[0-9]{1})[^0-9]*?([0-9]{4}))", "i");
	                    a_sMatches = oRegEx.exec(sDateString);
	                }

	                    //#### Fall from the loop (as we've found the first English definition)
	                break;
	            }
	        }

	            //#### If we were able to find a_sMatches for a non-American English "DD MM YYYY" formatted date
	        if (a_sMatches != null) {
	            var oRegEx = new RegExp(a_sMatches[0], "i");
	                //#### .parse the sDateString via the normal Date.parse function, but replacing the "DD?MM?YYYY" with "YYYY/MM/DD" beforehand
	                //####     NOTE: a_sMatches[0]=[Default]; a_sMatches[1]=DD?MM?YYYY; a_sMatches[2]=DD; a_sMatches[3]=MM; a_sMatches[4]=YYYY
	            dReturn = fDateParse(sDateString.replace(oRegEx, a_sMatches[4] + "/" + a_sMatches[3] + "/" + a_sMatches[2]));
	        }
	            //#### Else .parse the sDateString via the normal Date.parse function
	        else {
	            dReturn = fDateParse(sDateString);
	        }

	            //#### 
	        return dReturn;
	    }
	})();

	/* private functions */
	var $newRow = function() { return $("<tr />"); }

	/**
	http://stackoverflow.com/questions/2483719/get-weeks-in-month-through-javascript/2485172#2485172
	**/
	var getWeeksInMonth = function(year, month_number) {
		// month_number is in the range 1..12

		var firstOfMonth = new Date(year, month_number-1, 1);
		var lastOfMonth = new Date(year, month_number, 0);

		var used = firstOfMonth.getDay() + lastOfMonth.getDate();

		return Math.ceil( used / 7);
	}

	/**
	http://www.tek-tips.com/viewthread.cfm?qid=1577853&page=3
	**/
	function y2k(number) { return (number < 1000) ? number + 1900 : number; }
	function getWeek(year,month,day) {
		var when = new Date(year,month,day);
		var newYear = new Date(year,0,1);
		var modDay = newYear.getDay();
		if (modDay == 0) modDay=6; else modDay--;

		var daynum = ((Date.UTC(y2k(year),when.getMonth(),when.getDate(),0,0,0) -
					 Date.UTC(y2k(year),0,1,0,0,0)) /1000/60/60/24) + 1;

		if (modDay < 4 ) {
			var weeknum = Math.floor((daynum+modDay-1)/7)+1;
		}
		else {
			var weeknum = Math.floor((daynum+modDay-1)/7);
			if (weeknum == 0) {
				year--;
				var prevNewYear = new Date(year,0,1);
				var prevmodDay = prevNewYear.getDay();
				if (prevmodDay == 0) prevmodDay = 6; else prevmodDay--;
				if (prevmodDay < 4) weeknum = 53; else weeknum = 52;
			}
		}

		return weeknum;
	}		
    /****/	

	$.fn.jaCalendar = function(method)
	{
		var methods = {
			init: function(options)
			{
				var settings = $.extend({}, $.fn.jaCalendar.defaults, options);
				var $target = settings.target ? settings.target : $(this);
				var days = settings.days;
				var months = settings.months;
				var dateBase = new Date();
				var year = dateBase.getFullYear();
				var month = dateBase.getMonth();
				var todayDate = new Date(year, month, dateBase.getDate());
				var selectedMonth = settings.month - 1;
				var selectedYear = settings.year;
				var specialDates = [];
				$.each(settings.specialDates, function(i, sdObject) {
					$.each(sdObject.dates, function(j, sdate) {
						specialDates.push({
							date: new Date(Date.parse(sdate)),
							selectable: sdObject.selectable,
							dateClass: sdObject.dateClass
						})
					});
				});

				var isSpecialDate = function(aDate)
				{
					for (var i = 0; i < specialDates.length; i++)
						if (+specialDates[i].date == +aDate)
						 	return i;

					return -1;
				}

				var daysInMonth = new Date(selectedYear, selectedMonth+1, 0).getDate();
				var weeksInMonth = getWeeksInMonth(selectedYear, selectedMonth);
				var firstDayOfMonth = new Date(selectedYear, selectedMonth, 1);
				var firstWeekday = firstDayOfMonth.getDay();

				var renderDays = function()
				{
					var $days = $("td.date");
					var $firstDay = $("td.date.day" + firstWeekday + ".week1");
					
					for (var i = $days.index($firstDay),
							 d = 1,
							 x = 0;
							 i < $days.length,
							 d < daysInMonth,
							 x < daysInMonth;
							 i++,
							 d++,
							 x++)
					{
						var thisDate = new Date(selectedYear, selectedMonth, d);
						var $thisDay = $($days[i]);
						$thisDay.html(settings.leadingZero ? (d < 10 ? '0' + d : d) : d)
								.data("date", thisDate)
								.addClass("selectable");
						
						if (+thisDate == +todayDate)
							$thisDay.addClass("today");
							
						if (+thisDate == +$target.data("selectedDate.jaCalendar"))
							$thisDay.addClass("selected");
						
						var sdIndex = isSpecialDate(thisDate);

						if (sdIndex > -1)
						{
							$thisDay.addClass(specialDates[sdIndex].dateClass);
							if (!specialDates[sdIndex].selectable)
								$thisDay.removeClass("selectable");
						}
					}

					var $lastDay = $("td.date:contains('" + daysInMonth + "')");

					$("td.date:gt(" + $days.index($lastDay) + "):empty").remove();
					$("tr:empty", $table).remove();
					$("td.date:empty", $table).removeClass("date");	

					$("td.date.selectable").click(function() {
						$target.data("selectedDate.jaCalendar", $(this).data("date"));
						$("td.date", $target).removeClass("selected");
						$(this).addClass("selected");
					});
				}
	
				if ($(".calendar", $target).length === 0)
				{				
					var $table = $("<table class='calendar' />");
					$.each($.fn.jaCalendar.header(settings, selectedYear, selectedMonth), function(i, obj) {
						$(obj).appendTo($table);
					});

					$.each($.fn.jaCalendar.weekdays(weeksInMonth), function(i, obj) {
						$(obj).appendTo($table);
					});
					
					$table.appendTo($target);

					renderDays();

					settings.month = selectedMonth + 1;
					settings.year = selectedYear;

					$("button.prev-month", $target).click(function() {
						methods.prevMonth.apply($target);
					});
					$("button.next-month", $target).click(function() {
						methods.nextMonth.apply($target);
					});
					
					$.each($.fn.jaCalendar.footer(settings), function(i, obj) {
						$(obj).appendTo($table);
					});
					
					$("button.today-button", $target).click(function() {
						methods.now.apply($target);
					});
				}
				else
				{
					var $table = $(".calendar", $target);
					$("tr.weekrow", $table).remove();
					$.each($.fn.jaCalendar.weekdays(weeksInMonth), function(i, obj) {
						$(obj).insertBefore('.footer');
					});
					renderDays();
					$(".calendar .header-label").html(
						$.fn.jaCalendar.period(settings, selectedYear, selectedMonth)
					);
				}

				$target.data("settings.jaCalendar", settings);
			},
			getDate: function()
			{
				return this.data("selectedDate.jaCalendar");
			},
			getToday: function()
			{
				return $("td.date.today", this).data("date");
			},
			nextMonth: function()
			{
				var newSettings = $(this).data("settings.jaCalendar")
				if (newSettings.month < 12)
				{
					newSettings.month++;
				}
				else
				{
					newSettings.month = 1;
					newSettings.year++;
				}

				newSettings.target = this;
				methods.init(newSettings);
				return this;
			},
			prevMonth: function()
			{
				var newSettings = $(this).data("settings.jaCalendar");
				if (newSettings.month > 1)
				{
					newSettings.month--;
				}
				else
				{
					newSettings.month = 12;
					newSettings.year--;
				}
				newSettings.target = this;
				methods.init(newSettings);
				return this;
			},
			changePeriod: function(month, year)
			{
				var newSettings = $(this).data("settings.jaCalendar");
				newSettings.month = month;
				newSettings.year = year;
				newSettings.target = this;
				methods.init(newSettings);
				return this;
			},
			now: function()
			{
				var newSettings = $(this).data("settings.jaCalendar");
				newSettings.month = new Date().getMonth() + 1;
				newSettings.year = new Date().getFullYear();
				newSettings.target = this;
				methods.init(newSettings);
				return this;
			}
		};

		if (method && typeof method !== 'object' && method != "init")
		{
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		}

		var mainArgs = arguments;
		return this.each(function() {
		    if ( methods[method] ) {
		    	return methods[ method ].apply( this, Array.prototype.slice.call( mainArgs, 1 ));
		    } else if ( typeof method === 'object' || ! method ) {
		    	return methods.init.apply( this, mainArgs );
		    } else {
		    	$.error( 'Method ' +  method + ' does not exist on jQuery.jaCalendar' );
		    }    
		});
	};

	$.fn.jaCalendar.defaults = {
		shortDayNames: true,
		month: new Date().getMonth(),
		year: new Date().getFullYear(),
		allowChangeMonth: true,
		showTodayButton: true,
		leadingZero: false,
		highlightToday: true,
		blurWeekend: true,
		specialDates: [],
		todayButtonLabel: "Hoy",
		days: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
		months: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
	};

	$.fn.jaCalendar.period = function(settings, selectedYear, selectedMonth)
	{
		return settings.months[selectedMonth] + " " + selectedYear;
	};
	
	$.fn.jaCalendar.header = function(settings, selectedYear, selectedMonth)
	{
		var $header = $newRow();
		$header.addClass("header");
		var $headerTh = $("<th />");
		var $headerSpan = $("<span class='header-label'>"
						+ $.fn.jaCalendar.period(settings, selectedYear, selectedMonth)
						+ "</span>");
		var $headerBtnPrev = $("<button class='prev-month'>&lt;</button>");
		var $headerBtnNext = $("<button class='next-month'>&gt;</button>");
		$headerBtnPrev.appendTo($headerTh);
		$headerSpan.appendTo($headerTh);
		$headerBtnNext.appendTo($headerTh);
		$headerTh.attr("colspan", 7);
		$headerTh.appendTo($header);

		var $tr = $newRow();
		$tr.attr("class", "days");
		$.each(settings.days, function(i, d) {
			if (settings.shortDayNames)
			{
				d = d.substr(0, 3);
			}
			$("<th>" + d + "</th>").appendTo($tr);
		});

		return [$header, $tr];
	};
	
	$.fn.jaCalendar.footer = function(settings)
	{
		var $footer = $newRow().addClass("footer");
		var $td = $("<td colspan='7' />");
		if (settings.showTodayButton)
		{
			var $todayBtn = $("<button class='today-button'>" + settings.todayButtonLabel + "</button>");
			$todayBtn.appendTo($td);
		}
		if ($td.children().length > 0)
		{
			$td.appendTo($footer);
			return [$footer];
		}
	}

	$.fn.jaCalendar.weekdays = function(weeksInMonth)
	{
		var weekRowArray = [];
		for (var w = 0; w <= weeksInMonth; w++)
		{
			var $weekRow = $newRow().addClass("weekrow");
			for (var j = 0; j < 7; j++)
			{
				$("<td class='date " 
					+ (j == 0 || j == 6 ? "weekend" : "")
					+ " week" + (w+1)
					+ " day" + (j) + "' />"
				).appendTo($weekRow);
			}
			weekRowArray.push($weekRow);
		}		
		return weekRowArray;
	}
})(jQuery);