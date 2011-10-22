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
 
/**
 * Title: jQuery ja.Calendar
 * A calendar plugin for jQuery. Supports date ranges and customized date colouring
 * (not just weekends).
 *
 * Quick usage:
 * (start code)
 *   $("#myCalendar").jaCalendar();
 * (end code)
 **/
 (function($) {
	/***
	 * Section: JavaScript Core Extensions
	 **/
	(function() {
	    var fDateParse = Date.parse;

	    /***
	     * Function: Date.parse()
	     * 
	     * Extends JavaScript's Date.parse to allow for DD/MM/YYYY (non-US formatted dates)
	     * (from <Campblen at http://stackoverflow.com/questions/3003355/extending-javascripts-date-parse-to-allow-for-dd-mm-yyyy-non-us-formatted-date>).
	     *
	     * Parameters:
	     *	sDateString - date text to parse.
	     *
	     * Returns:
	     *	(Date) A JavaScript Date object.
	     **/
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

	/***
	 * Function: toDayMonthYearDate
	 *
	 * Converts a Date object to its string representation, using the DD/MM/YYYY format.
	 *
	 * Usage:
	 * (start code)
	 *    var myDate = new Date();
	 *    var myFormattedDate = myDate.toDayMonthYearDate();
	 * (end code)
	 *
	 * Returns:
	 *   (string) A formatted date string.
	 **/
	Date.prototype.toDayMonthYearDate = function()
	{
		return (this.getDate() < 10 ? '0' + this.getDate() : this.getDate())
		     + '/'
		     + (this.getMonth() + 1 < 10 ? '0' + (this.getMonth() + 1) : this.getMonth() + 1)
		     + '/'
		     + this.getFullYear();
	};

	/***
	 * Section: Plugin Private Functions
	 **/

	/***
	 * Function: $newRow
	 *
	 * Returns:
	 * 	(jQuery) An empty table row as a jQuery object. Used as base element for the calendar composition.
	 **/
	var $newRow = function()
	{
		return $("<tr />");
	}

	/***
	 * Function: getWeeksInMonth
	 *
	 * Calculates the number of weeks in a given month.
	 * (from <Ed Poor at http://stackoverflow.com/questions/2483719/get-weeks-in-month-through-javascript/2485172#2485172>).
	 *
	 * Parameters:
	 *	year - the year's month.
	 *  month - the month to analyze (1..12).
	 *
	 * Returns:
	 *	(int) Number of weeks.
	 **/
	var getWeeksInMonth = function(year, month_number) {
		// month_number is in the range 1..12

		var firstOfMonth = new Date(year, month_number-1, 1);
		var lastOfMonth = new Date(year, month_number, 0);

		var used = firstOfMonth.getDay() + lastOfMonth.getDate();

		return Math.ceil( used / 7);
	}

	/***
	 * Function: y2k
	 *
	 * Auxiliary function used on <getWeek>.
	 * (from <a forum post at http://www.tek-tips.com/viewthread.cfm?qid=1577853&page=3>).
	 *
	 * Returns:
	 *	(number) Parsed year.
	 */
	function y2k(number) { return (number < 1000) ? number + 1900 : number; }

	/***
	 * Function: getWeek
	 *
	 * Calculates the number of the week of the year, given a date.
	 * (from <a forum post at http://www.tek-tips.com/viewthread.cfm?qid=1577853&page=3>).
	 *
	 * Parameters:
	 *	year - The date's year.
	 *	month - The date's month.
	 *	day - The date's day.
	 *
	 * Returns:
	 *	(number) The week of the year.
	 */
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

	/***
	 * Section: Plugin Public Functions
	 **/
	$.fn.jaCalendar = function(method)
	{
		var methods = {
			/**
			 * Constructor: init
			 * 
			 * Initializes the jaCalendar widget.
			 *
			 * Parameters:
			 * 	options - an object with the calendar settings. See <defaults> for available options.
			 *
			 * Usage:
			 * (start code)
			 *	 $("#myCalendar").jaCalendar(options);
			 *	 $(".some-calendars, .other-calendars").jaCalendar(options);
			 * (end code)
			 *
			 * Returns:
			 *	(jQuery) A jQuery object collection.
			 */
			init: function(options)
			{
				// Merges user options with defaults.
				var settings = $.extend({}, $.fn.jaCalendar.defaults, options);

				// If the target's specified on settings (when calendar is rebuilt)
				// use that one, otherwise, the current one.
				var $target = settings.target ? settings.target : $(this);

				// Build date components.
				var days = settings.days;
				var months = settings.months;
				var dateBase = new Date();
				var year = dateBase.getFullYear();
				var month = dateBase.getMonth();
				var todayDate = new Date(year, month, dateBase.getDate());
				var selectedMonth = settings.month - 1;
				var selectedYear = settings.year;
				var daysInMonth = new Date(selectedYear, selectedMonth+1, 0).getDate();
				var weeksInMonth = getWeeksInMonth(selectedYear, selectedMonth);
				var firstDayOfMonth = new Date(selectedYear, selectedMonth, 1);
				var firstWeekday = firstDayOfMonth.getDay();

				// Load special dates into an array.
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

				// Function to verify if a given date is a "special date".
				var isSpecialDate = function(aDate)
				{
					for (var i = 0; i < specialDates.length; i++)
						if (+specialDates[i].date == +aDate)
						 	return i;

					return -1;
				}

				// Function for building the calendar.
				var renderDays = function()
				{
					// Select all calendar date cells.
					var $days = $("td.date", $target);

					// Select the first day of the month.
					var $firstDay = $("td.date.day" + firstWeekday + ".week1", $target);
					
					// Place the day numbers.
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

						// Add leading zero if specified.
						// By default, all days are selectable.
						$thisDay.html(settings.leadingZero ? (d < 10 ? '0' + d : d) : d)
								.data("date", thisDate)
								.addClass("selectable");
						
						// Mark with special CSS if when the current day is today.
						if (+thisDate == +todayDate)
							$thisDay.addClass("today");
						
						// Recover and mark selected date/date ranges.
						// Used the term "recover" because when period changes,
						// the CSS for the selected days is gone. Therefore, reinsert it here.
						switch (settings.selectionMode)
						{
							case "single":
								// It's just one date. If the current date is the one, select it.
								if (+thisDate == +$target.data("selectedDate.jaCalendar"))
									$thisDay.addClass("selected");
							break;
							case "range":
								if ($target.data("selectedDate.jaCalendar") !== undefined)
								{
									var range = $target.data("selectedDate.jaCalendar");
									// If the current day is between the range limits, mark the day.
									if (+range.from <= +thisDate && +thisDate <= +range.to)
										$thisDay.addClass("selected");
								}
							break;
						}
						
						// Is it a special date today?
						var sdIndex = isSpecialDate(thisDate);

						if (sdIndex > -1)
						{
							// Yes! Then mark it according to the CSS class.
							// If the date isn't selectable, remove such behaviour.
							$thisDay.addClass(specialDates[sdIndex].dateClass);
							if (!specialDates[sdIndex].selectable)
								$thisDay.removeClass("selectable");
						}

						// Does the calendar allows past date?
						if (!settings.allowPastDates && +thisDate < +todayDate)
							$thisDay.removeClass("selectable").addClass("past");
					}

					// Select the last day of the month.
					var $lastDay = $("td.date:contains('" + daysInMonth + "')", $target);

					// Remove empty cells beyond the last day.
					$("td.date:gt(" + $days.index($lastDay) + "):empty", $target).remove();

					// Remove any empty rows.
					$("tr:empty", $target).remove();

					// Disregard empty cells, they're not dates.
					$("td.date:empty", $target).removeClass("date");	

					// When clicked, the date will be selected.
					$("td.date.selectable", $target).click(function(e) {
						$.fn.jaCalendar.selectDate.apply($(this), [$target, settings]);
					});
				}
				
				// Does the calendar already exists?
				if ($(".calendar", $target).length === 0)
				{			
					// No, then render it.
					var $table = $("<table class='calendar' />");

					// Create header.
					$.each($.fn.jaCalendar.header(settings, selectedYear, selectedMonth), function(i, obj) {
						$(obj).appendTo($table);
					});

					// Create weekdays.
					$.each($.fn.jaCalendar.weekdays(weeksInMonth), function(i, obj) {
						$(obj).appendTo($table);
					});
					
					// Include in container.
					$table.appendTo($target);

					// Draw the calendar itself.
					renderDays();

					// Refresh period settings to current period.
					settings.month = selectedMonth + 1;
					settings.year = selectedYear;

					// Event binding for buttons.

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
					
					$("button.go-period-button", $target).click(function() {
						methods.changePeriod.apply($target, [parseInt($(".calendar .month-list", $target).val()) + 1, $(".calendar .year-input", $target).val()]);
						return false;
					});

					// Only numbers in the year input box.
					$("input.year-input", $target).keypress(function(e) {
						return "1234567890".indexOf(String.fromCharCode(e.keyCode)) > -1;
					});

					// Plugin event handlers.
									
					$target.bind("selectedDateChanged", function() {
						if (typeof settings.selectedDateChanged === "function")
							settings.selectedDateChanged.apply($target, [$target.data("selectedDate.jaCalendar"), settings.selectionMode]);
					});

					$target.bind("selectedRangeChanged", function() {
						if (typeof settings.selectedRangeChanged === "function")
							settings.selectedRangeChanged.apply($target, [$target.data("selectedDate.jaCalendar"), $target.jaCalendar("dateDiff")]);
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
					// Yes!, the calendar already exists. Then, select it and remove old data.
					var $table = $(".calendar", $target);
					$("tr.weekrow", $target).remove();
					$.each($.fn.jaCalendar.weekdays(weeksInMonth), function(i, obj) {
						$(obj).insertBefore($('.footer', $target));
					});

					// Redraw days.
					renderDays();
					
					// Change header data according to period input mode.
					// (can be label or dropdown).
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

				// Save all settings.
				$target.data("settings.jaCalendar", settings);

				return $target;
			},
			/**
			 * Function: getDate
			 *
			 * Returns the selected date in the calendar.
			 *
			 * Usage:
			 *	$("#myCalendar").jaCalendar("getDate");
			 *
			 * Returns:
			 *	- (Date) a single JavaScript date object, if <selectionMode> is 'single'.
			 *	- (object) a JavaScript hash containing the selected range boundaries, if <selectionMode> is 'range'.
			 */
			getDate: function()
			{
				return this.data("selectedDate.jaCalendar");
			},
			/**
			 * Function: getToday
			 *
			 * Returns today's date from the calendar. Same as <new Date()>.
			 *
			 * Usage:
			 *  $("#myCalendar").jaCalendar("getToday");
			 */
			getToday: function()
			{
				return $("td.date.today", this).data("date");
			},
			/**
			 * Method: nextMonth
			 *
			 * Changes the calendar to the next month.
			 *
			 * Usage:
			 *	$("#myCalendar").jaCalendar("nextMonth");
			 *
			 * Returns:
			 *	(jQuery) the calendar's jQuery object collection.
			 */
			nextMonth: function()
			{
				// Invoke user callback before changing!
				$(this).trigger("beforePeriodChange");

				var newSettings = $(this).data("settings.jaCalendar")
				var changes = true;
				
				// Change the month and the year accordingly.
				if (newSettings.month < 12)
				{
					newSettings.month++;

					// Adjust month navigational controls visibility.
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

				// If changes where registered, rebuild the calendar.
				// No changes are made when period changes are restricted and the
				// calendar is either at the beginning/end of the year or
				// cannot change its current month.
				if (changes)
				{
					newSettings.target = this;

					// Period has changed, invoke user callback.
					$(this).trigger("periodChanged");

					// Reinitialize with new settings.
					methods.init(newSettings);
				}

				return this;
			},
			/**
			 * Method: prevMonth
			 *
			 * Changes the calendar to the previous month.
			 *
			 * Usage:
			 *	$("#myCalendar").jaCalendar("prevMonth");
			 *
			 * Returns:
			 *	(jQuery) the calendar's jQuery object collection.
			 */
			prevMonth: function()
			{
				// Invoke user callback before changing!
				$(this).trigger("beforePeriodChange");

				var newSettings = $(this).data("settings.jaCalendar");
				var changes = true;
				
				// Change the month and the year accordingly.
				if (newSettings.month > 1)
				{
					newSettings.month--;

					// Adjust month navigational controls visibility.
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
				
				// If changes where registered, rebuild the calendar.
				// No changes are made when period changes are restricted and the
				// calendar is either at the beginning/end of the year or
				// cannot change its current month.
				if (changes)
				{
					newSettings.target = this;

					// Period has changed, invoke user callback.
					$(this).trigger("periodChanged");

					// Reinitialize with new settings.
					methods.init(newSettings);
				}
				return this;
			},
			/**
			 * Method: changePeriod
			 *
			 * Changes the calendar's period to a given month and date.
			 *
			 * Parameters:
			 *	month
			 *	year
			 *
			 * Usage:
			 *	$("#myCalendar").jaCalendar("changePeriod", 1, 2011);
			 *
			 * Returns:
			 *	(jQuery) the calendar's jQuery object collection.
			 */
			changePeriod: function(month, year)
			{
				// Invoke user callback before changing!
				$(this).trigger("beforePeriodChange");

				// Update settings with new period.
				var newSettings = $(this).data("settings.jaCalendar");
				newSettings.month = month;
				newSettings.year = year;
				newSettings.target = this;

				// Period has changed, invoke user callback and reinitialize the calendar.
				$(this).trigger("periodChanged");
				methods.init(newSettings);

				return this;
			},
			/**
			 * Method: now
			 *
			 * Changes the calendar's period to today's month and year,
			 *
			 * Usage:
			 *  $("#myCalendar").jaCalendar("now");
			 *
			 * Returns:
			 *	(jQuery) the calendar's jQuery object collection.
			 */
			now: function()
			{
				// Invoke user callback before changing!
				$(this).trigger("beforePeriodChange");

				// Update settings with new period.
				var newSettings = $(this).data("settings.jaCalendar");
				newSettings.month = new Date().getMonth() + 1;
				newSettings.year = new Date().getFullYear();
				newSettings.target = this;

				// Period has changed, invoke user callback and reinitialize the calendar.
				$(this).trigger("periodChanged");
				methods.init(newSettings);

				return this;
			},
			/**
			 * Function: dateDiff
			 *
			 * Returns the number of days between the range's boundaries.
			 *
			 * Usage:
			 *	$("#myCalendar").jaCalendar("dateDiff");
			 *
			 * Returns:
			 *	(number) The number of days between 'from' and 'to' values in the range.
			 */
			dateDiff: function()
			{
				var d = this.data("selectedDate.jaCalendar");
				return (+d.to - +d.from) / 1000 / 60 / 60 / 24;
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

	/**
	 * Constants: selectionModes
	 *
	 * single - restricts the date to a single selection.
	 * range - allows a date range to be selected.
	 */
 	$.fn.jaCalendar.selectionModes = {
 		single: 'single',
 		range: 'range'
 	};

	/**
	 * Section: Plugin Configuration
	 */
	$.fn.jaCalendar.defaults = {
		/**
		 * Group: Events
		 */

		/**
		 * Event: selectedDateChange
		 *
		 * Occurs when a date is clicked in the calendar. Defaults to null.
		 *
		 * Parameters:
		 *	selectedDate - contains the selected date.
		 *	selectionMode - specifies how the selection was performed ('single' or 'range').
		 * 
		 * Usage:
		 * 	selectedDateChanged: function(selectedDate, selectionMode) { ... }
		 */
		selectedDateChanged: null,

		/**
		 * Event: periodChanged
		 *
		 * Occurs when the calendar period has changed. Defaults to null.
		 * 
		 * Parameters:
		 *	currentMonth - current month of the calendar.
		 *	currentYear - current year of the calendar.
		 *		 
		 * Usage:
		 * 	periodChanged: function(currentMonth, currentYear) { ... }
		 */
		periodChanged: null,

		/**
		 * Event: beforePeriodChanged
		 *
		 * Occurs before the calendar period is changed. Defaults to null.
		 * 
		 * Parameters:
		 *	currentMonth - current month of the calendar, before changing.
		 *	currentYear - current year of the calendar, before changing.
		 *		 
		 * Usage:
		 * 	beforePeriodChanged: function(currentMonth, currentYear) { ... }
		 */
		beforePeriodChanged: null,

		/**
		 * Event: selectedRangeChanged
		 *
		 * Occurs when a range is selected in the calendar. Defaults to null.
		 *
		 * Parameters:
		 *	selectedDate - contains the selected date range.
		 *	dateDiff - specifies the difference in days between the range's boundaries.
		 * 
		 * Usage:
		 * 	selectedRangeChanged: function(selectedDate, dateDiff) { ... }
		 */
		selectedRangeChanged: null,

		/**
		 * Group: Appearance
		 */
		
		/**
		 * Property: shortDayNames
		 *
		 * Sets whether the names must be printed completely or in its short form. Defaults to true.
		 *
		 * Usage:
		 *	shortDayNames: true|false
		 */
		shortDayNames: true,

		/**
		 * Property: shortDayNameLength
		 *
		 * Sets how long in characters must be the short name. Defaults to 3.
		 *
		 * Usage:
		 *	shortDayNames: (number)
		 */
		shortDayNameLength: 3,

		/**
		 * Property: leadingZero
		 *
		 * Sets whether the day numbers will have a leading zero or not. Defaults to false.
		 *
		 * Usage:
		 *	leadingZero: true|false
		 */
		leadingZero: false,

		/**
		 * Property: highlightToday
		 *
		 * Sets whether today's date will be styled with a highlight class or not. Defaults to true.
		 *
		 * Usage:
		 *	highlightToday: true|false
		 */
		highlightToday: true,

		/**
		 * Property: blurWeekend
		 *
		 * Sets whether Saturdays and Sundays will be grayed or not. Defaults to true.
		 *
		 * Usage:
		 *	blurWeekend: true|false
		 */
		blurWeekend: true,

		/**
		 * Group: Data
		 */
		
		/**
		 * Property: month
		 *
		 * Sets the calendar's month. Defaults to the current month, in a 1..12 range.
		 *
		 * Usage:
		 *	month: (number[1..12])
		 */
		month: new Date().getMonth() + 1,

		/**
		 * Property: year
		 *
		 * Sets the calendar's year. Defaults to the current year.
		 *
		 * Usage:
		 *	year: (number)
		 */
		year: new Date().getFullYear(),

		/**
		 * Property: specialDates
		 *
		 * Specifies groups of dates that will be treated with particular behaviour and styling.
		 * Defaults to []. A group is defined with a hash like:
		 *
		 * > {
		 * >    dateClass: "someCssClass",
		 * >    selectable: true|false,
		 * >    dates: ['01/01/2011', '02/01/2011']
		 * > }
		 *
		 * 'dateClass' contains a CSS class that will distinguish the group. 'selectable' sets
		 * whether the date can be clicked on or not. Non-selectable dates will act as stop-points
		 * for range selection. 'dates' contains an array of parseable date strings.
		 * 
		 * Usage:
		 *	specialDates: [{...}, {...}, {...}]
		 */
		specialDates: [],

		/**
		 * Group: Behaviour
		 */

		/**
		 * Property: allowChangeMonth
		 *
		 * Sets whether to allow the calendar to change the period's month or not. Defaults to true.
		 * If set to false, the 'Previous Month' and 'Next Month' buttons will not be visible.
		 *
		 * Usage:
		 *	allowChangeMonth: true|false
		 */
		allowChangeMonth: true,

		/**
		 * Property: allowChangeYear
		 *
		 * Sets whether to allow the calendar to change the period's year or not. Defaults to true.
		 * If set to false, the 'Previous Month' and 'Next Month' buttons will be visible, yet
		 * restricted to the specified year.
		 *
		 * Usage:
		 *	allowChangeYear: true|false
		 */
		allowChangeYear: true,

		/**
		 * Property: usePeriodInput
		 *
		 * Sets whether to use the period's dropdown and inputbox instead of the simple month/year label.
		 * Defaults to false. If set to true, the label is replaced by a month dropdown, a year textbox
		 * and a 'Go' button to change to the specified period.
		 * 
		 * Usage:
		 *	usePeriodInput: true|false		 
		 */
		usePeriodInput: false,

		/**
		 * Property: showTodayButton
		 *
		 * Sets whether to show the Today button or not.
		 *
		 * Usage:
		 *	showTodayButton: true|false
		 */
		showTodayButton: true,

		/**
		 * Property: selectionMode
		 *
		 * Specifies the selection mode of the calendar. Defaults to <selectionModes.single>.
		 * Possible values are in the 'selectionModes' constant enumeration.
		 *
		 * Usage:
		 *	selectionMode: $.fn.jaCalendar.selectionModes.(single|range)
		 */
		selectionMode: $.fn.jaCalendar.selectionModes.single,

		/**
		 * Property: minRangeLength
		 *
		 * Sets the minimum length for the selection range. Defaults to -1 (no minimum).
		 *
		 * Usage:
		 *	minRangeLength: (number)
		 */
		minRangeLength: -1,

		/**
		 * Property: maxRangeLength
		 *
		 * Sets the maximum length for the selection range. Defaults to -1 (no limit).
		 *
		 * Usage:
		 *	maxRangeLength: (number)
		 */
		maxRangeLength: -1,

		/**
		 * Property: allowPastDates
		 *
		 * Sets whether to allow dates before today or not. Defaults to false.
		 *
		 * Usage:
		 *	allowPastDates: true|false
		 */
		allowPastDates: false,

		/**
		 * Group: Localisation
		 */
		
		/**
		 * Property: todayButtonLabel
		 *
		 * Sets the label for the Today button.
		 *
		 * Usage:
		 *	todayButtonLabel: "Today"
		 */
		todayButtonLabel: "Hoy",

		/**
		 * Property: goPeriodButtonLabel
		 *
		 * Sets the label for the Go button (used when <usePeriodInput> is set to true).
		 *
		 * Usage:
		 *	goPeriodButtonLabel: "Go"
		 */
		goPeriodButtonLabel: "Ir",

		/**
		 * Property: days
		 *
		 * Contains a list of the days, starting from Sunday, ending on Saturday.
		 * Defaults to the Spanish equivalent (["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]).
		 *
		 * Usage:
		 *	days: ["Sunday", "Monday", ..., "Saturday"]
		 */
		days: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],

		/**
		 * Property: months
		 *
		 * Contains a list of the months, starting from January, ending on December.
		 * Defaults to the Spanish equivalent (["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]).
		 *
		 * Usage:
		 *	months: ["January", "February", ..., "December"]
		 */
		months: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
	};

	/**
	 * Section: Plugin Rendering Components
 	 */

 	/**
 	 * Function: period
 	 *
 	 * Returns the current month's name and year for the header.
 	 *
 	 * Parameters:
 	 *	settings      - the calendar settings object.
 	 *	selectedYear  - a year.
 	 *	selectedMonth - a month.
 	 *
 	 * Usage:
 	 *	$.fn.jaCalendar.period(settings, 2011, 1);
 	 *
 	 * Returns:
 	 *	(string) The current month's name and year.
 	 **/
	$.fn.jaCalendar.period = function(settings, selectedYear, selectedMonth)
	{
		return settings.months[selectedMonth] + " " + selectedYear;
	};
	
	/**
	 * Function: header
	 *
	 * Returns the header elements.
	 *
 	 * Parameters:
 	 *	settings      - the calendar settings object.
 	 *	selectedYear  - a year.
 	 *	selectedMonth - a month.
 	 *
 	 * Usage:
 	 *	$.fn.jaCalendar.header(settings, 2011, 1);
	 *
	 * Returns:
	 *	(array) A collection of jQuery header elements.
	 **/
	$.fn.jaCalendar.header = function(settings, selectedYear, selectedMonth)
	{
		// Creates the header container.
		var $header = $newRow();
		$header.addClass("header");
		var $headerTh = $("<th />");
		
		var $headerSpan = $("<span class='header-label'></span>");
		
		if (!settings.usePeriodInput)
		{
			// Write the default month/year string if no navigation input is used.
			$headerSpan.html($.fn.jaCalendar.period(settings, selectedYear, selectedMonth));
			$headerSpan.appendTo($headerTh);
		}
		else
		{
			// Create a month list.
			var $headerMonths = $("<select class='month-list'></select>");
			$.each(settings.months, function(i, month) {
				$("<option " + (i+1 == settings.month ? "selected" : "") + " value='" + i + "'>" + month + "</option>").appendTo($headerMonths);
			});
			
			// Create a year input box.
			var $headerYear = $("<input type='text' maxlength='4' size='4' class='year-input' value='" + selectedYear + "' />");
			
			// Create a button to update the period.
			var $headerGoPeriod = $("<button class='go-period-button'>" + settings.goPeriodButtonLabel + "</button>");
			
			// Add all elements.
			$headerMonths.appendTo($headerTh);
			$headerYear.appendTo($headerTh);
			$headerGoPeriod.appendTo($headerTh);
		}
		
		// Create previous and next buttons.
		var $headerBtnPrev = $("<button class='prev-month'>&lt;</button>");
		var $headerBtnNext = $("<button class='next-month'>&gt;</button>");
		$headerBtnPrev.appendTo($headerTh);
		$headerBtnNext.appendTo($headerTh);

		// Set header column length.
		$headerTh.attr("colspan", 7);
		$headerTh.appendTo($header);

		// Create day names table row.
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
	
	/**
	 * Function: footer
	 *
	 * Creates all footer elements for the calendar.
	 *
	 * Parameters:
 	 *	settings      - the calendar settings object.
 	 *
 	 * Usage:
 	 *	$.fn.jaCalendar.footer(settings);
 	 *
 	 * Returns:
 	 *	(array) The footer elements as jQuery object.
 	 */
	$.fn.jaCalendar.footer = function(settings)
	{
		// Create the footer container.
		var $footer = $newRow().addClass("footer");
		var $td = $("<td colspan='7' />");

		if (settings.showTodayButton)
		{
			// Add the Today button, to go back to the current month, if wanted.
			var $todayBtn = $("<button class='today-button'>" + settings.todayButtonLabel + "</button>");
			$todayBtn.appendTo($td);
		}

		// Only append if required.
		if ($td.children().length > 0)
		{
			$td.appendTo($footer);
			return [$footer];
		}
	}

	/**
	 * Function: weekdays
	 *
	 * Return an array of cell elements CLASS'ed with the days of the month, as empty cells.
	 * 
	 * Parameters:
	 *	weeksInMonth - the number of weeks in the month
	 *
	 * Usage:
	 *	$.fn.jaCalendar.weekdays(weeksInMonth);
	 *
	 * Returns:
	 *	(array) Cell elements.
	 */
	$.fn.jaCalendar.weekdays = function(weeksInMonth)
	{
		var weekRowArray = [];
		for (var w = 0; w <= weeksInMonth; w++)
		{
			var $weekRow = $newRow().addClass("weekrow");
			for (var j = 0; j < 7; j++)
			{
				// Each day cell contains a class indicating the weekday number
				// (0 = sunday, ..., 6 = saturday) and the week number.
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
	
	/**
	 * Method: selectDate
	 *
	 * Handles the date selection process of the calendar.
	 *
	 * Parameters:
	 *	$calendar - a jQuery object representing the jaCalendar.
	 *	$settings - the calendar's settings hash.
	 *
	 * Usage:
	 *	$.fn.jaCalendar.selectDate($calendar, settings);
	 *
	 * Returns:
	 *	(none)
	 */
	$.fn.jaCalendar.selectDate = function($calendar, settings)
	{
		switch (settings.selectionMode.toLowerCase())
		{
			// If only a date can be selected, mark it as selected and save it.
			case "single":
				$calendar.data("selectedDate.jaCalendar", $(this).data("date"));
				$("td.date", $calendar).removeClass("selected");
				$(this).addClass("selected");
			break;
			// If it's a range...
			case "range":
				// Check whether the beginning or the end of the range is being selected.
				if ($calendar.data("selectedDate.jaCalendar") === undefined
					|| ($calendar.data("selectedDate.jaCalendar").from != null
						&& $calendar.data("selectedDate.jaCalendar").to != null))
				{
					// Nothing found, assume new range. Save it and select the first day.
					$calendar.data("selectedDate.jaCalendar", {from: $(this).data("date"), to: null});
					$("td.date", $calendar).removeClass("selected");
					$(this).addClass("selected");
				}
				else
				{
					// Found a part of the range. Off to complete it.
					// Calculate how many days are between.
					var fromDate = $calendar.data("selectedDate.jaCalendar").from;
					var toDate = $(this).data("date");
					var $days = $("td.date", $calendar);
					var $firstDay = $("td.date.selected", $calendar);
					var fromIndex = $days.index($firstDay);
					var toIndex = $days.index($(this));
					var dateDiff = (+toDate - +fromDate) / 1000 / 60 / 60 / 24;
					
					if (fromIndex < 0) fromIndex = 0;
					
					var d = 0;

					// Limit the range as specified or as long as the range goes.
					settings.maxRangeLength = settings.maxRangeLength == -1 ? toIndex : settings.maxRangeLength;
					
					// Start date must be before the end date.
					if (+toDate <= +fromDate)
					{
						// For ease of use, assume new range. Save it and select it as the first day.
						$calendar.data("selectedDate.jaCalendar", {from: $(this).data("date"), to: null});
						$("td.date", $calendar).removeClass("selected");
						$(this).addClass("selected");

						return;
					}

					// Range must be within limits.
					if (dateDiff < settings.minRangeLength - 1 && settings.minRangeLength != -1)
						return;

					for (var i = fromIndex;
							 i <= toIndex;
							 i++)
					{
						if (!$($days[i]).hasClass("selectable") || d >= settings.maxRangeLength)
						{
							// We're done marking!.
							break;
						}
						
						// Mark each date as selected.
						$($days[i]).addClass("selected");
						d++;
					}						
					
					// Save the range.
					$calendar.data("selectedDate.jaCalendar", {from: fromDate, to: $($days[i-1]).data("date")});

					// Invoke callback after changing the selected range.
					$calendar.trigger("selectedRangeChanged");
				}
			break;
		}

		// Invoke callback after changing the last selected date,
		// regardless of selection mode.
		$calendar.trigger("selectedDateChanged");
	}
})(jQuery);