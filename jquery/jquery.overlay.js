/*
 * Overlay - jQuery overlay plugin for DataTables ( http://datatables.net )
 *
 * Copyright (c) 2010 mot <2matvei@gmail.com>
 *
 * Licensed under the GPLv3 license:
 *   http://www.opensource.org/licenses/gpl-3.0.html
 *
 * Project home:
 *   http://www.matvei.ru
 *
 * Inspired by jQuery Tools overlay
 *
 */
/**
  * Version 0.2
  *
  * '*' - mandatory
  * @name  Overlay
  * @type  jQuery
  * @param Hash			options					Additional options.
  * @param string		options[top]			Vertical position. Default '10%' from top.
  * @param string		options[left]			Horizontal position. Default 'center'.
  *
  */

/*
 * TODO:
 * optimize storage - now we have array of arrays with 1 element
 * possibly add ESC key event
 *
 */

(function($) {

    $.fn.overlay2 = function(options) {
    	return { overlay: this, options: $.extend({}, $.overlay2.defaultOptions, options), load: $.overlay2.load, close: $.overlay2.close };
    };

    $.overlay2 = {
    	load: function() {
			var top, left, w = $(window),
			//get overlay dimensions
			oWidth = this.overlay.outerWidth({ margin:true }), oHeight = this.overlay.outerHeight({ margin:true });

			if (typeof this.options.top == 'string') {
				top = this.options.top == 'center' ? Math.max((w.height() - oHeight) / 2, 0) :
					parseInt(this.options.top, 10) / 100 * w.height();
			}

			if (this.options.left == 'center') left = Math.max((w.width() - oWidth) / 2, 0);

			top += w.scrollTop();
			left += w.scrollLeft();

			// position overlay
			this.overlay.css({ top: top, left: left }).show();

			//create only one event
			if (!$(document).data('overlay2')) {
				$(document).bind('click.overlay', $.overlay2.checkOverlays).data('overlay2', true);
			}
		},

		close: function() {
			this.overlay.hide();
		},

		//called on click event
    	checkOverlays: function(e) {
			var et = $(e.target),
			oParent = et.closest('div.simple_overlay, div.sub_overlay');

			if (!oParent.length) {//all close
				$('div.simple_overlay, div.sub_overlay').hide();
			}
			else {//close only children overlays
				oParent.find('div.simple_overlay, div.sub_overlay').hide();

				if (et.is('a.close')) {//if we clicked on close link
					oParent.hide();
				}
			}
    	}

    };

    //default options used
    $.overlay2.defaultOptions = { top: '10%', left: 'center' };

})(jQuery);