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
  * Version 0.3
  *
  * '*' - mandatory
  * @name  Overlay
  * @type  jQuery
  * @param Hash			options					Additional options.
  * @param string		options[className]		Overlay className, mandatory. Used for history tab. *
  * @param string		options[top]			Vertical position. Default '10%' from top.
  * @param string		options[left]			Horizontal position. Default 'center'.
  * @param bool			options[history]		Show history tabs. Default false.
  *
  */

/*
 * TODO:
 * possibly add ESC key event
 *
 */

(function($) {

    $.fn.overlay2 = function(options) {
    	return { overlay: this, options: $.extend({}, $.overlay2.defaultOptions, options), load: $.overlay2.load, html: $.overlay2.html, close: $.overlay2.close };
    };

    $.overlay2 = {

    	sHeader: '<a class="close"></a>',

    	//new way of creating overlays, supporting only 1 main overlay with history tabs and 1 modal overlay
    	create: function(options) {
    		options = $.extend({}, $.overlay2.defaultOptions, options);

			var oOverlay = $('div.' + options.className);

			if (!oOverlay.data('overlay2')) {//if no overlay - create it
				oOverlay = $('<div class="' + options.className + '"></div>').appendTo('body').data('overlay2', true);
			}

    		return { overlay: oOverlay, options: options, load: $.overlay2.load, html: $.overlay2.html, close: $.overlay2.close };
    	},


    	load: function() {
			var top, left, w = $(window),
			//get overlay dimensions
			oWidth = this.overlay.outerWidth({ margin:true }), oHeight = this.overlay.outerHeight({ margin:true });

			if (typeof this.options.top == 'string') {
				top = this.options.top == 'center' ? Math.max((w.height() - oHeight) / 2, 0) :
					parseInt(this.options.top, 10) / 100 * w.height();
			}
			else {
				top = parseInt(this.options.top);
			}

			if (this.options.left == 'center') {
				left = Math.max((w.width() - oWidth) / 2, 0);
			}
			else {
				left = parseInt(this.options.left);
			}

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
			var oTarget = $(e.target),
			oParent = oTarget.closest('div.simple_overlay, div.sub_overlay');

			if (!oParent.length) {//all close
				$('div.simple_overlay, div.sub_overlay').hide();
			}
			else {//close only children overlays
//				oParent.find('div.simple_overlay, div.sub_overlay').hide();//not used now, because we removed 'create multiple overlay' code from jquery.dteditable.js

				if (oTarget.is('a.close')) {//if we clicked on close link
					oParent.hide();
				}
			}

			//work with overlay history
			if (oTarget.closest('ul.overlay2History').length) {
				$.get(oTarget.attr('href'), function(sText) {
					$.overlay2.htmlAndHistory(oTarget.closest('div.simple_overlay'), sText.sPageContents, this.url, oTarget);
				});

				return false;
			}
    	},

    	//set overlay html + optional history
    	html: function(sContents, sOverlayURL) {
    		if (this.options.history) {
    			$.overlay2.htmlAndHistory(this.overlay, sContents, sOverlayURL);
    		}
    		else {
    			$.overlay2.htmlNoHistory(this.overlay, sContents);
    		}
    	},

    	htmlNoHistory: function(oOverlay, sContents) {
    		var oContents = oOverlay.children('div.tabsPaneBorderAll');

    		if (!oContents.length) {
    			oContents = $('<div class="tabsPaneBorderAll"></div>').appendTo(oOverlay);
    		}

    		oContents.html($.overlay2.sHeader + sContents);//new content
    	},

    	htmlAndHistory: function(oOverlay, sContents, sOverlayURL, oA) {
    		//get history ul
    		var oHistory = oOverlay.children('ul.overlay2History'),
    			oContents = oOverlay.children('div.tabsPane');

    		if (!oHistory.length) {
    			oHistory = $('<ul class="tabs overlay2History"></ul>').appendTo(oOverlay);
    			oContents = $('<div class="tabsPane"></div>').appendTo(oOverlay);
    		}

    		oHistory.find('a.current').removeClass('current');//remove active class from previous active

    		oContents.html($.overlay2.sHeader + sContents);//new content

    		if (oA) {//check if we clicked on history tab
    			oA.addClass('current');
    		}
    		else {
	    		if (oHistory.children().length > 6) {//no more than 7 tabs
	    			oHistory.children().first().remove();
	    		}

	    		oHistory.append('<li><a href="'+ sOverlayURL + '" class="current">'+ oHistory.parent().find('div.ui-widget-header').first().html() + '</a></li>');
    		}
    	}

    };

    //default options used
    $.overlay2.defaultOptions = { top: '10%', left: 'center', history: false };

})(jQuery);