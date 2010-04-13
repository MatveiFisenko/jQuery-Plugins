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
  * '*' - mandatory
  * @name  DTEditable
  * @type  jQuery
  * @param String	target				(POST) URL or function to send edited content to. *
  * @param Hash		options				Additional options.
  * @param Object	options[oTable] 	DataTables object. *
  * @param Function	options[callback]	Function to run after submitting edited content.
  * @param Hash		options[submitdata]	Extra parameters to send when submitting edited content. Can be function returning hash.
  * @param bool		options[toolbar]	Create toolbar (default true).
  *
  */

/*
 * TODO:
 * possible change #example tbody td with #example tbody
 * possible change events click -> dblclick and vice versa
 * submit bug report about e.preventDefault() and e.stopPropagation() - it makes no sense when work with overlay;
 *
 */

(function($) {

    $.fn.editable = function(target, options) {

    	var iOptionsID = $.editable.options.length;
    	$.editable.options[iOptionsID] = $.extend({}, $.editable.defaultOptions, options);

    	this.eq(0).closest('table').data('editable.iOptionsID', iOptionsID);

    	if (options.toolbar !== false) {
    		$.editable.createToolbar(options.oTable);
    	}

    	this.live('click.' + $.editable.sSelfName, function(e) {
    		if ($(this).data('bEditing')) return;

//          e.preventDefault();//because overlays do not get click event
            e.stopPropagation();

    		$(this).data('sOldText', this.innerHTML)
    			.html('<input type="text" value="' + this.innerHTML + '" />')
    			.data('bEditing', true)
    			.children().focus();

    		$.editable.setTimeout(this);
    	});

    	this.live('keydown.' + $.editable.sSelfName, function(e) {
    		if (!$(this).data('bEditing')) return;

    		if (e.which == 13) {//enter
    			$.editable.clearTimeout(this);

    			var oSubmitData = {
    				id: this.id,
    				value: e.target.value
    			};

    			var options = $.editable.options[$(this).closest('table').data('editable.iOptionsID')];

    			if (options.submitdata) {
    				if ($.isFunction(options.submitdata)) {
                        $.extend(oSubmitData, options.submitdata.call(this, options.oTable));
                    }
    				else {
    					$.extend(oSubmitData, options.submitdata);
                    }
    			}

    			$.post(target, oSubmitData, $.proxy(function (sText) {
    					$.editable.setText(this, sText);

    					if ($.isFunction(options.callback)) {
    						options.callback.call(this, sText, options.oTable);
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

    	this.live('dblclick.' + $.editable.sSelfName, function(e) {
    		if (e.target != this && ($.editable.getTime() > $(this).data('iTimeoutStartTime') + 500)) return;

    		var options = $.editable.options[$(this).closest('table').data('editable.iOptionsID')];

    		if (!options.oOverlay) {
    			if ($('#overlay').length) {//if we have overlay already - use it
    				options.oOverlay = $('#overlay').overlay();
    			}
    			else {
	    			options.oOverlay = $('<div class="simple_overlay" id="overlay"></div>').appendTo('body').overlay({
	    				top: '10%',
	    				speed: 'fast',
	    				closeOnClick: true,
	    				api: true
	    			});
    			}
    		}

    		$('#overlay').load(sModuleURL + 'show/' + options.oTable.fnGetData(this.parentNode)[0]);

    		options.oOverlay.load();
    	});
    };

    $.editable = {
    	options: [],
    	sSelfName: 'dteditable',


   		setTimeout: function(e) {
    		$.editable.clearTimeout(e);

    		$(e).data('iTimeoutID', setTimeout(function() {$.editable.setText(e);}, 2000));
    		$(e).data('iTimeoutStartTime', $.editable.getTime());
    	},
    	clearTimeout: function(e) {
    		clearTimeout($(e).data('iTimeoutID'));
    	},
    	getTime: function() {
    		return (new Date()).getTime();
    	},
    	setText: function(e, sText) {
    		$(e).html(sText || $(e).data('sOldText')).removeData('bEditing');
    	},

    	//used as default options
    	defaultCallback: function(sValue, oTable) {
			var aPos = oTable.fnGetPosition(this);
			oTable.fnUpdate(sValue, aPos[0], aPos[2], false);//with last option we can re-sort table after update, but we lose pagination
		},
		defaultSubmitdata: function(oTable) {
			return {
				"iID": oTable.fnGetData(this.parentNode)[0],
				"sColumnName": oTable.fnSettings().aoColumns[oTable.fnGetPosition(this)[2]].sName
			};
		},

    	//create toolbar
    	createToolbar: function(oTable) {
			oTable.parent().find('div.dtBar')
				.html('<div class="ui-state-default ui-corner-all" style="padding: 4px;"><span class="ui-icon ui-icon-circle-plus"></span></div>')
				.children().hover(
		    		function() { $(this).addClass('ui-state-hover'); },
		    		function() { $(this).removeClass('ui-state-hover'); }
		    	)
		    	.find('.ui-icon-circle-plus').click(function(){$.editable.addRow(oTable);});
    	},

    	//add new row
    	addRow: function(oTable) {
    		$.post(sModuleURL + 'add', function(sText, sStatus, oJSReq) {
    			$(oTable.fnGetNodes(oTable.fnAddData(oJSReq.responseJS)))
    				.children(':first').trigger($.editable.edit);
    		});
    	}
    };

	//default options used
    $.editable.defaultOptions = { callback: $.editable.defaultCallback, submitdata: $.editable.defaultSubmitdata };
    $.editable.edit = 'click.' + $.editable.sSelfName;

})(jQuery);