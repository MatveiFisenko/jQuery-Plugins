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
  * Version 0.2
  *
  * '*' - mandatory
  * @name  Tab
  * @type  jQuery
  * @param selector		container		Tab containter. *
  *
  */

/*
 * TODO:
 *
 */

(function($) {

	$.fn.tabs = function(container) {
		//return false if not container supplied
		if (!container) return false;

		//do nothing if works with it already
		if (this.data('tabs')) return this;

		this.data('tabs', true);

		this.click(function(e, bNoChange) {
			var oA = $(e.target);
			//if not href
			if (!oA.is('a')) return;

			var sPath = oA.attr('href');

			if (!sPath) return;

			$.get(sPath, function(sText, sStatus, oJS) {
				$(container).html(oJS.responseJS.sPageContents);
			});

			oA.parent().addClass('current').siblings().removeClass('current');

			if (!bNoChange) {
				//not change if we (possible) have lower level tabs, which need original location.hash.
				//CAUTION - we need to change location.hash for history plugin support, if we have no lower level tabs BUT location.hash is like this #/level1/level2
				//it was implemented here in previous revs, see svn history, but is removed because not used
				location.hash = sPath;
			}

			//store current path, used for history support
			$(this).data('sPath', sPath);

			return false;
		});

		//try to open tab from location, if no success - open first
		if (!$.tabs.findAndOpenTab(this.find('a'))) {
			this.find('a:first').click();
		}

		//history support
		var self = this;
		setInterval(function() {
			//find all A except current
			$.tabs.findAndOpenTab(self.find('a[href!=' + self.data('sPath') + ']'));
		}, 500);

		return this;
	};

	$.tabs = {
		findAndOpenTab: function(oA) {
			var bFind = true, sCurrentLocation = location.hash.replace("#", "");
			oA.each(function() {
				//if location.hash is empty, it simple matches the first href
				if ($(this).attr('href') === sCurrentLocation) {
					$(this).click();
					return bFind = false;//we need false here because of return
				}
				else if (sCurrentLocation.search($(this).attr('href')) > -1) {//if href is only part of location
					$(this).trigger('click', [true]);//send true to change location later, because it can be used by lower level tabs
					return bFind = false;
				}
			});

			//return reverse
			return !bFind;
		}
	};

})(jQuery);