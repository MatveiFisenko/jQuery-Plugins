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
    	options = $.extend({}, $.overlay2.defaultOptions, options);

    	return { overlay: this, options: options, load: $.overlay2.load };
    };

    $.overlay2 = {
    	overlays: [],

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

			//can be miss because click events may be stopped somewhere
			if ($.inArray(this.overlay, $.overlay2.overlays) < 0) {
				$.overlay2.overlays.push(this.overlay);
			}
		},

    	checkOverlays: function(e) {
    		for (var i = 0, length = $.overlay2.overlays.length, et = $(e.target), overlay; i < length; i++) {
    			overlay = $.overlay2.overlays[i];

    			//do not close if we clicked inside overlay OR overlay itself OR we clicked inside .sub_overlay
    			if (overlay.has(et).length || et[0] == overlay[0] || et.parents('div.sub_overlay').length) continue;

    			overlay.hide();
    			$.overlay2.overlays.splice(i, 1);//remove this overlay

    			//reduce pointer and iterator (because we removed one element from array) and check if it points to the last element, if so - return
    			if (length-- == i--) return;
    		}

    		//unbind event if no overlays left
    		if (!$.overlay2.overlays.length) $(document).unbind("click.overlay").data('overlay2', false);
    	}

    };

    //default options used
    $.overlay2.defaultOptions = { top: '10%', left: 'center' };

})(jQuery);