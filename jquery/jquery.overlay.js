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
  * Version 0.1
  *
  * '*' - mandatory
  * @name  Overlay
  * @type  jQuery
  * @param Hash			options					Additional options.
  */

/*
 * TODO:
 * optimize storage - now we have array of arrays with 1 element
 *
 */

(function($) {

    $.fn.overlay2 = function(options) {
    	var w = $(window);

    	function overlay_c(obj, options) {
    		this.overlay = obj;
    		this.options = $.extend({}, $.overlay2.defaultOptions, options);

    		this.load = function() {
    			var top, left;

    			// get overlay dimensions
    			console.log('load');
				var oWidth = this.overlay.outerWidth({margin:true});
				var oHeight = this.overlay.outerHeight({margin:true});

    			if (typeof this.options.top == 'string')  {
					top = this.options.top == 'center' ? Math.max((w.height() - oHeight) / 2, 0) :
						parseInt(this.options.top, 10) / 100 * w.height();
				}

    			if (this.options.left == 'center') { left = Math.max((w.width() - oWidth) / 2, 0); }

    			top += w.scrollTop();
				left += w.scrollLeft();

				// position overlay
				this.overlay.css({top: top, left: left, position: 'absolute'});
				this.overlay.show();

				//create only one event
				if (!$(document).data('overlay2')) {
					$(document).bind('click.overlay', $.overlay2.closeOverlays);
					$(document).data('overlay2', true);
				}

				//can be miss because click events may be stopped somewhere
				if ($.inArray(this.overlay, $.overlay2.overlays) < 0) {
					$.overlay2.overlays[$.overlay2.overlays.length] = this.overlay;
				}
			};

//			this.hide = function() {
//				this.overlay.hide();
//			};

    		return this;
    	}

    	return new overlay_c(this, options);
    };

    $.overlay2 = {
    	overlays: [],


    	closeOverlays: function(e) {
    		console.log('event');
    		var et = $(e.target);

    		for (var i = 0, length = $.overlay2.overlays.length, overlay; i < length; i++) {
    			overlay = $.overlay2.overlays[i];

    			//do not close if we clicked inside overlay OR overlay itself OR we clicked inside .sub_overlay
    			if (overlay.has(et).length || et[0] == overlay[0] || et.parents().is('div.sub_overlay')) continue;

    			overlay.hide();
    			$.overlay2.overlays.splice(i, 1);//remove this overlay

    			//reduce pointer (because we removed one element from array) and check if it points to the last element, if so - return
    			if ((length = $.overlay2.overlays.length) == --i) return;
    		}
    	}

    };

    //default options used
    $.overlay2.defaultOptions = { top: '10%', left: 'center' };

})(jQuery);