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
  * Version 0.2
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

    	//if options are unset - make empty object
    	options = options || {};

    	//if we pass DataTables object directly
    	if (this.fnUpdate) options.oTable = this;
    	//if we have no oTable - do nothing
    	else if (!options.oTable) return false;

    	//merge options with default ones
    	$.editable.options[iOptionsID] = $.extend({}, $.editable.defaultOptions, options);

    	this.data($.editable.sSelfName + 'iOptionsID', iOptionsID);

    	if (options.toolbar !== false) {
    		$.editable.createToolbar(options.oTable);
    	}

    	this.children('tbody').bind('click.' + $.editable.sSelfName, function(e) {
    		if (!$(e.target).is('td')) return;

    		//find current TD
    		var oTD = $(e.target);

    		if (oTD.data($.editable.sSelfName + 'bEditing')) return;

//          e.preventDefault();//because overlays do not get click event
            e.stopPropagation();

            oTD.data($.editable.sSelfName + 'sOldText', oTD[0].innerHTML)
    			.html('<input type="text" value="' + oTD[0].innerHTML + '" />')
    			.data($.editable.sSelfName + 'bEditing', true)
    			.children().focus();

    		$.editable.setTimeout(oTD);
    	});

    	this.children('tbody').bind('keydown.' + $.editable.sSelfName, function(e) {
    		if (!$(e.target).is('input')) return;

    		//find current TD
    		var oTD = $(e.target.parentNode);

    		if (!oTD.data($.editable.sSelfName + 'bEditing')) return;

    		if (e.which == 13) {//enter
    			$.editable.clearTimeout(oTD);

    			var oSubmitData = {
    				id: oTD[0].id,
    				value: e.target.value
    			};

    			var options = $.editable.options[$(this.parentNode).data($.editable.sSelfName + 'iOptionsID')];

    			if (options.submitdata) {
    				if ($.isFunction(options.submitdata)) {
    					//pass DOM object to callback
                        $.extend(oSubmitData, options.submitdata.call(oTD[0], options.oTable));
                    }
    				else {
    					$.extend(oSubmitData, options.submitdata);
                    }
    			}

    			$.post(target, oSubmitData, $.proxy(function (sText) {
    					$.editable.setText(oTD, sText);

    					if ($.isFunction(options.callback)) {
    						//pass DOM object to callback
    						options.callback.call(oTD[0], sText, options.oTable);
    					}
    				}, oTD));
    		}
    		else if (e.which == 27) {//esc
    			$.editable.clearTimeout(oTD);
    			$.editable.setText(oTD);
    		}
    		else {//all other
    			$.editable.setTimeout(oTD);
    		}
    	});

    	this.children('tbody').bind('dblclick.' + $.editable.sSelfName, function(e) {
    		if (!$(e.target).is('td, input')) return;

    		//find current TD
    		var oTD = $(e.target).is('td') ? e.target : e.target.parentNode;

    		var options = $.editable.options[$(this.parentNode).data($.editable.sSelfName + 'iOptionsID')];

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

    		$('#overlay').load(sModuleURL + 'show/' + options.oTable.fnGetData(oTD.parentNode)[0]);

    		options.oOverlay.load();
    	});

    	return this;
    };

    $.editable = {
    	options: [],
    	sSelfName: 'dteditable',


   		setTimeout: function(e) {
    		$.editable.clearTimeout(e);

    		e.data($.editable.sSelfName + 'iTimeoutID', setTimeout(function() {$.editable.setText(e);}, 2000));
    	},
    	clearTimeout: function(e) {
    		clearTimeout(e.data($.editable.sSelfName + 'iTimeoutID'));
    	},
    	setText: function(e, sText) {
    		e.html(sText || e.data($.editable.sSelfName + 'sOldText')).removeData($.editable.sSelfName + 'bEditing');
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