/*
 * Overlay - jQuery tabs plugin
 *
 * Copyright (c) 2010 mot <2matvei@gmail.com>
 *
 * Licensed under the GPLv3 license:
 *   http://www.opensource.org/licenses/gpl-3.0.html
 *
 * Project home:
 *   http://www.matvei.ru
 *
 * Inspired by jQuery Tools tabs
 *
 */
/**
  * Version 0.1
  *
  * '*' - mandatory
  * @name  Tab
  * @type  jQuery
  * @param selector		container		Tab containter. *
  *
  */

/*
 * TODO:
 * Add history support for lower level tabs - like /admin/timeline
 *
 */

(function($) {

	$.fn.tabs = function(container) {
		//return false if not container supplied
		if (!container) return false;

		//do nothing if works with it already
		if (this.data('tabs')) return this;

		this.data('tabs', true);

		this.click(function(e, bWaitBeforeChange) {
			var oA = $(e.target);
			//if not href
			if (!oA.is('a')) return;

			var sPath = oA.attr('href').replace("#", "");//actually we do not need this replace, left for compatibility

			if (!sPath) return;

			$.get(sPath, function(sText, sStatus, oJS) {
				$(container).html(oJS.responseJS.sPageContents);
			});

			oA.parent().addClass('current').siblings().removeClass('current');

			//be neat, clean if we had one before
			if ($.tabs.iTimeOutID) {
				//we clean timeout because we do not want to get first-level tab sPath as history point
				clearTimeout($.tabs.iTimeOutID);
				$.tabs.iTimeOutID = null;
			}

			//if we have first load trigger event
			if (bWaitBeforeChange) {
				//we do so because we can have lower level tabs, which need original location.hash.
				//but we need to change location.hash for history plugin support, if no lower tabs found.
				$.tabs.iTimeOutID = setTimeout(function() { location.hash = sPath; }, 1000);
			}
			//change location hash in a moment on natural click event
			else {
				location.hash = sPath;
			}

			//store current path, used for history support
			$(this).data('currentPath', sPath);

			return false;
		});

		//try to open tab from location
		this.find('a').each(function(i, element) {
			//if location.hash is empty, it simple matches the first href
			if ($(this).attr('href').search(location.hash.replace("#", "")) > -1) {
				$(this).trigger('click');
				return false;
			}
			else if (location.hash.replace("#", "").search($(this).attr('href')) > -1) {//if href is only part of location
				$(this).trigger('click', [true]);//send true to change location later, because it can be used by lower level tabs
				return false;
			}
		});

		//history support
		setInterval($.proxy(function() {
			var h = location.hash.replace("#", "");
			var oA = this.find('a[href=' + h + ']');

			if (oA.length && h !== this.data('currentPath')) {
				oA.trigger('click');
			}
		}, this), 200);

		return this;
	};

	$.tabs = {
		iTimeOutID: null
	};

})(jQuery);