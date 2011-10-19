/*
 **********************************************************************************
 * jQuery ja.Calendar
 * by Joel A. Villarreal Bertoldi
 **********************************************************************************
 * Licensed under the GNU GPLv3 and the MIT licenses.
 **********************************************************************************
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 **********************************************************************************
 * Copyright (c) 2011 Joel A. Villarreal Bertoldi
 * 
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 **********************************************************************************
 */
 
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
	@url http://stackoverflow.com/questions/2483719/get-weeks-in-month-through-javascript/2485172#2485172
	@author Ed Poor
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
					var $days = $("td.date", $target);
					var $firstDay = $("td.date.day" + firstWeekday + ".week1", $target);
					
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
						
						switch (settings.selectionMode)
						{
							case "single":
								if (+thisDate == +$target.data("selectedDate.jaCalendar"))
									$thisDay.addClass("selected");
							break;
							case "range":
								if ($target.data("selectedDate.jaCalendar") !== undefined)
								{
									var range = $target.data("selectedDate.jaCalendar");
									if (+range.from <= +thisDate && +thisDate <= +range.to)
										$thisDay.addClass("selected");
								}
							break;
						}
						
						var sdIndex = isSpecialDate(thisDate);

						if (sdIndex > -1)
						{
							$thisDay.addClass(specialDates[sdIndex].dateClass);
							if (!specialDates[sdIndex].selectable)
								$thisDay.removeClass("selectable");
						}
					}

					var $lastDay = $("td.date:contains('" + daysInMonth + "')", $target);

					$("td.date:gt(" + $days.index($lastDay) + "):empty", $target).remove();
					$("tr:empty", $target).remove();
					$("td.date:empty", $target).removeClass("date");	

					$("td.date.selectable", $target).click(function(e) {
						$.fn.jaCalendar.selectDate.apply($(this), [$target, settings]);
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
						return false;
					});
					$("button.next-month", $target).click(function() {
						methods.nextMonth.apply($target);
						return false;
					});
					
					$.each($.fn.jaCalendar.footer(settings), function(i, obj) {
						$(obj).appendTo($table);
					});
					
					$("button.today-button", $target).click(function() {
						methods.now.apply($target);
						return false;
					});
					
					$("input.year-input", $target).keypress(function(e) {
						return "1234567890".indexOf(String.fromCharCode(e.keyCode)) > -1;
					});
					
					$("button.go-period-button", $target).click(function() {
						methods.changePeriod.apply($target, [parseInt($(".calendar .month-list", $target).val()) + 1, $(".calendar .year-input", $target).val()]);
						return false;
					});
				
					$target.bind("selectedDateChanged", function() {
						if (typeof settings.selectedDateChanged === "function")
							settings.selectedDateChanged.apply($target, [$target.data("selectedDate.jaCalendar"), settings.selectionMode]);
					});

					$target.bind("beforePeriodChange", function() {
						if (typeof settings.beforePeriodChange === "function")
							settings.beforePeriodChange.apply($target, [settings.currentMonth, settings.currentYear]);
					});
					
					$target.bind("periodChanged", function() {
						if (typeof settings.periodChanged === "function")
							settings.periodChanged.apply($target, [settings.currentMonth, settings.currentYear]);
					});
				}
				else
				{
					var $table = $(".calendar", $target);
					$("tr.weekrow", $target).remove();
					$.each($.fn.jaCalendar.weekdays(weeksInMonth), function(i, obj) {
						$(obj).insertBefore($('.footer', $target));
					});
					renderDays();
					
					if (!settings.usePeriodInput)
					{
						$(".calendar .header-label", $target).html(
							$.fn.jaCalendar.period(settings, selectedYear, selectedMonth)
						);
					}
					else
					{
						$(".calendar .month-list option[value='" + selectedMonth + "']").attr("selected", "selected");
						$(".calendar .year-input").val(selectedYear);
					}
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
				$(this).trigger("beforePeriodChange");

				var newSettings = $(this).data("settings.jaCalendar")
				var changes = true;
				
				if (newSettings.month < 12)
				{
					newSettings.month++;
					if (!newSettings.allowChangeYear && newSettings.month == 12)
					{
						$("button.next-month", this).hide();
						$("button.prev-month", this).show();
					}
					else
					{
						$("button.next-month, button.prev-month", this).show();
					}
				}
				else
				{
					if (newSettings.allowChangeYear)
					{
						newSettings.month = 1;
						newSettings.year++;
					}
					else
					{
						changes = false;
					}
				}

				if (changes)
				{
					newSettings.target = this;
					$(this).trigger("periodChanged");
					methods.init(newSettings);
				}
				return this;
			},
			prevMonth: function()
			{
				$(this).trigger("beforePeriodChange");

				var newSettings = $(this).data("settings.jaCalendar");
				var changes = true;
				
				if (newSettings.month > 1)
				{
					newSettings.month--;
					if (!newSettings.allowChangeYear && newSettings.month == 1)
					{
						$("button.next-month", this).show();
						$("button.prev-month", this).hide();
					}
					else
					{
						$("button.next-month, button.prev-month", this).show();
					}
				}
				else
				{
					if (newSettings.allowChangeYear)
					{
						newSettings.month = 12;
						newSettings.year--;
					}
					else
					{
						changes = false;
					}
				}
				
				if (changes)
				{
					newSettings.target = this;
					$(this).trigger("periodChanged");
					methods.init(newSettings);
				}
				return this;
			},
			changePeriod: function(month, year)
			{
				$(this).trigger("beforePeriodChange");
				var newSettings = $(this).data("settings.jaCalendar");
				newSettings.month = month;
				newSettings.year = year;
				newSettings.target = this;
				methods.init(newSettings);
				$(this).trigger("periodChanged");
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
		selectedDateChanged: null,
		periodChanged: null,
		shortDayNames: true,
		month: new Date().getMonth(),
		year: new Date().getFullYear(),
		allowChangeMonth: true,
		allowChangeYear: true,
		usePeriodInput: false,
		showTodayButton: true,
		leadingZero: false,
		highlightToday: true,
		blurWeekend: true,
		specialDates: [],
		shortDayNameLength: 3,
		selectionMode: "single",
		todayButtonLabel: "Hoy",
		goPeriodButtonLabel: "Ir",
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
		
		var $headerSpan = $("<span class='header-label'></span>");
		
		if (!settings.usePeriodInput)
		{
			$headerSpan.html($.fn.jaCalendar.period(settings, selectedYear, selectedMonth));
			$headerSpan.appendTo($headerTh);
		}
		else
		{
			var $headerMonths = $("<select class='month-list'></select>");
			$.each(settings.months, function(i, month) {
				$("<option " + (i+1 == settings.month ? "selected" : "") + " value='" + i + "'>" + month + "</option>").appendTo($headerMonths);
			});
			
			var $headerYear = $("<input type='text' maxlength='4' size='4' class='year-input' value='" + selectedYear + "' />");
			
			var $headerGoPeriod = $("<button class='go-period-button'>" + settings.goPeriodButtonLabel + "</button>");
			
			$headerMonths.appendTo($headerTh);
			$headerYear.appendTo($headerTh);
			$headerGoPeriod.appendTo($headerTh);
		}
		
		var $headerBtnPrev = $("<button class='prev-month'>&lt;</button>");
		var $headerBtnNext = $("<button class='next-month'>&gt;</button>");
		$headerBtnPrev.appendTo($headerTh);
		$headerBtnNext.appendTo($headerTh);
		$headerTh.attr("colspan", 7);
		$headerTh.appendTo($header);

		var $tr = $newRow();
		$tr.attr("class", "days");
		$.each(settings.days, function(i, d) {
			if (settings.shortDayNames)
			{
				d = d.substr(0, settings.shortDayNameLength);
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
	
	$.fn.jaCalendar.selectDate = function($calendar, settings)
	{
		switch (settings.selectionMode.toLowerCase())
		{
			case "single":
				$calendar.data("selectedDate.jaCalendar", $(this).data("date"));
				$("td.date", $calendar).removeClass("selected");
				$(this).addClass("selected");
			break;
			case "range":
				if ($calendar.data("selectedDate.jaCalendar") === undefined || ($calendar.data("selectedDate.jaCalendar").from != null && $calendar.data("selectedDate.jaCalendar").to != null))
				{
					$calendar.data("selectedDate.jaCalendar", {from: $(this).data("date"), to: null});
					$("td.date", $calendar).removeClass("selected");
					$(this).addClass("selected");
				}
				else
				{
					var fromDate = $calendar.data("selectedDate.jaCalendar").from;
					var $days = $("td.date", $calendar);
					var $firstDay = $("td.date.selected", $calendar);
					var fromIndex = $days.index($firstDay);
					var toIndex = $days.index($(this));
					
					if (fromIndex < 0) fromIndex = 0;
					
					for (var i = fromIndex;
							 i <= toIndex;
							 i++)
					{
						if (!$($days[i]).hasClass("selectable"))
						{
							$calendar.data("selectedDate.jaCalendar", {from: fromDate, to: $($days[i - 1]).data("date")});
							break;
						}
						
						$($days[i]).addClass("selected");
					}
					
					$calendar.data("selectedDate.jaCalendar", {from: fromDate, to: $($days[i]).data("date")});
				}
			break;
		}
		$calendar.trigger("selectedDateChanged");
	}
})(jQuery);