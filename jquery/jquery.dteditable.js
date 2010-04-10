/*
 * DTEditable - jQuery in place edit plugin for DataTables ( http://datatables.net )
 *
 * Copyright (c) 2010 mot <2matvei@gmail.com>
 *
 * Licensed under the GPLv3 license:
 *   http://www.opensource.org/licenses/gpl-3.0.html
 *
 * Project home:
 *   http://www.matvei.ru
 *
 * Inspired by Jeditable by Mika Tuupola, Dylan Verheul
 *    http://www.appelsiini.net/projects/jeditable
 *
 */
/**
  * Version 0.1
  *
  * @name  DTEditable
  * @type  jQuery
  * @param String	target				(POST) URL or function to send edited content to
  * @param Hash		options				additional options
  * @param Object	options[oTable] 	DataTables object
  * @param Function	options[callback]	Function to run after submitting edited content
  * @param Hash		options[submitdata]	Extra parameters to send when submitting edited content.
  *
  */

//TODO possible change #example tbody td with #example tbody

(function($) {

    $.fn.editable = function(target, settings) {
    	this.live($.editable.sEventName, function(e) {
    		if ($(this).data('bEditing')) return;

            e.preventDefault();
            e.stopPropagation();

    		$(this).data('sOldText', this.innerHTML)
    			.html('<input type="text" value="' + this.innerHTML + '" />')
    			.data('bEditing', true)
    			.children().focus();

    		$.editable.setTimeout(this);
    	});

    	this.live('keydown', function(e) {
    		if (!$(this).data('bEditing')) return;

    		if (e.which == 13) {//enter
    			$.editable.clearTimeout(this);

    			var oSubmitData = {
    				id: this.id,
    				value: e.target.value
    			};

    			if (settings.submitdata) {
    				if ($.isFunction(settings.submitdata)) {
                        $.extend(oSubmitData, settings.submitdata.call(this));
                    }
    				else {
    					$.extend(oSubmitData, settings.submitdata);
                    }
    			}

    			$.post(target, oSubmitData, $.proxy(function (sText) {
    					$.editable.setText(this, sText);

    					if ($.isFunction(settings.callback)) {
    						settings.callback.call(this, sText);
    					}
    				}, this));
    		}
    		else if (e.which == 27) {//esc
    			$.editable.clearTimeout(this);
    			$.editable.setText(this);
    		}
    		else {//all other
    			$.editable.setTimeout(this);
    		}
    	});

    	this.live('dblclick', function(e) {
    		console.log('dblclick');

    		if (!settings.oOverlay) {
    			settings.oOverlay = $('<div class="simple_overlay" id="overlay"></div>').appendTo('body').overlay({
    				top: '10%',
    				speed: 'fast',
    				closeOnClick: true,
    				api: true
    			});
    		}

    		$('#overlay').load(sModuleURL + 'show/' + settings.oTable.fnGetData(this.parentNode)[0]);

    		settings.oOverlay.load();
    	});
    };

    $.editable = {
   		setTimeout: function(e) {
    		$.editable.clearTimeout(e);

    		$(e).data('iTimeoutID', setTimeout(function() {$.editable.setText(e);}, 2000));
    	},
    	clearTimeout: function(e) {
    		clearTimeout($(e).data('iTimeoutID'));
    	},
    	setText: function(e, sText) {
    		$(e).html(sText || $(e).data('sOldText')).removeData('bEditing');
    	},
    	sEventName: 'click.dteditable'
    };

})(jQuery);