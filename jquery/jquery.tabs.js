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
 * port history plugin
 *
 */

(function($) {

	$.fn.tabs = function(container) {
		//return false if not container supplied
		if (!container) return false;

		//do nothing if works with it already
		if (this.data('tabs')) return this;

		this.data('tabs', true);

		this.click(function(e, bNoLocationChange) {
			var oA = $(e.target);
			//if not href
			if (!oA.is('a')) return;

			var sPath = oA.attr('href');

			if (!sPath) return;

			$.get(sPath, function(sText, sStatus, oJS) {
				$(container).html(oJS.responseJS.sPageContents);
			});

			oA.parent().addClass('current').siblings().removeClass('current');

			//start history plugin
			if (!bNoLocationChange) {
				//actually we do not need this replace, left for comapatibility
				location.hash = sPath.replace("#", "");
			}

			return false;
		});

		//try to open tab from location
		this.find('a').each(function(i, element) {
			//if location.hash is empty, it simple matches the first href
			if ($(this).attr('href').search(location.hash.replace("#", "")) > -1 || location.hash.replace("#", "").search($(this).attr('href')) > -1) {
				$(this).trigger('click', [true]);//send true not to change location, because it can be used by lower level tabs
				return false;
			}
		});

		return this;
	};

})(jQuery);