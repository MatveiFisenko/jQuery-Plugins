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
  * Version 0.3
  *
  * '*' - mandatory
  * @name  DTEditable
  * @type  jQuery
  * @param String	target					(POST) URL or function to send edited content to. *
  * @param Hash		options					Additional options.
  * @param Object	options[oTable] 		DataTables object. *
  * @param Function	options[callback]		Function to run after submitting edited content.
  * @param Hash		options[submitdata]		Extra parameters to send when submitting edited content. Can be function returning hash.
  * @param Hash		options[submitdata_add]	Extra parameters to send when adding new row. Can be function returning hash.
  * @param mixed	options[toolbar]		Create toolbar. Default true. 'modal' - modal add event, false - don't create.
  * @param Hash		options[selectColumns]	Values for creating <select> edits. Format: { columnName: {0: 'edit1', 1:'edit2' } }
  * @param bool		options[allowDetails]	Create overlay on dblclick event. Default true.
  * @param String	options[overlayClass]	Used to specify overlay class. Default simple_overlay. Be carefull - it is used as #id too!
  *
  */

/*
 * TODO:
 * possible change #example tbody td with #example tbody
 * possible change events click -> dblclick and vice versa
 * submit bug report about e.preventDefault() and e.stopPropagation() - it makes no sense when work with overlay;
 * better work with select inputs
 * use eventData in bind when work with toolbar etc
 *
 */

(function($) {

    $.fn.editable = function(target, options) {
    	var iOptionsID = $.editable.options.length;

    	//if options are unset - make empty object
    	options = options || {};

    	//we keep target only for compatibility with editable
    	options.sModuleURL = target;

    	//if we pass DataTables object directly
    	if (this.fnUpdate) options.oTable = this;
    	//if we have no oTable - do nothing
    	else if (!options.oTable) return false;

    	//merge options with default ones
    	$.editable.options[iOptionsID] = options = $.extend({}, $.editable.defaultOptions, options);

    	this.data($.editable.sSelfName + 'iOptionsID', iOptionsID);

    	//create toolbar
    	if (options.toolbar !== false) {
    		$.editable.createToolbar(options);
    	}

    	this.children('tbody').bind('click.' + $.editable.sSelfName, function(e) {
    		if (!$(e.target).is('td')) return;

    		//find current TD
    		var oTD = $(e.target);

    		if (oTD.data($.editable.sSelfName + 'bEditing')) return;

//          e.preventDefault();//because overlays do not get click event
            e.stopPropagation();

            var options = $.editable.getStoredOptions.call(this);

            //save current data
            oTD.data($.editable.sSelfName + 'sOldText', oTD[0].innerHTML);

            var sText, sColumnName = $.editable.getColumnName.call(oTD[0], options.oTable);
            //work with special columns
            if (options.selectColumns[sColumnName]) {
            	sText = $.editable.makeSelect(options.selectColumns[sColumnName], oTD.data($.editable.sSelfName + 'sOldText'));
            }
            else {
            	sText = '<input type="text" value="' + oTD[0].innerHTML + '" />';
            }

            oTD.html(sText)
            	.data($.editable.sSelfName + 'bEditing', true)
            	.children().focus();

    		$.editable.setTimeout(oTD);
    	});

    	this.children('tbody').bind('keydown.' + $.editable.sSelfName + ' change.' + $.editable.sSelfName, function(e) {
    		//if (change event and not select) OR not input - return
    		if (e.type == 'change') {
    			if (!$(e.target).is('select')) return;
    		}
    		else if (!$(e.target).is('input')) return;

    		//find current TD
    		var oTD = $(e.target.parentNode);

    		if (!oTD.data($.editable.sSelfName + 'bEditing')) return;

    		if (e.which == 13 || e.type == 'change') {//enter OR change
    			$.editable.clearTimeout(oTD);

    			var oSubmitData = {
    				id: oTD[0].id,
    				value: e.target.value
    			};

    			var options = $.editable.getStoredOptions.call(this);

    			if (options.submitdata) {
    				if ($.isFunction(options.submitdata)) {
    					//pass DOM object to callback
                        $.extend(oSubmitData, options.submitdata.call(oTD[0], options.oTable));
                    }
    				else {
    					$.extend(oSubmitData, options.submitdata);
                    }
    			}

    			$.post(options.sModuleURL + 'update', oSubmitData, $.proxy(function (sText, sStatus, oJSReq) {
    					//if we edited special column
	    				if (options.selectColumns[oSubmitData.sColumnName]) {
							sText = options.selectColumns[oSubmitData.sColumnName][parseInt(oJSReq.responseJS)];
						}
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

    	if (options.allowDetails)
    	this.children('tbody').bind('dblclick.' + $.editable.sSelfName, function(e) {
    		if (!$(e.target).is('td, input')) return;

    		//find current TD
    		var oTD = $(e.target).is('td') ? e.target : e.target.parentNode;

    		var options = $.editable.getStoredOptions.call(this);

    		$.editable.showOverlay(options, oTD);
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
    	getStoredOptions: function() {
    		return $.editable.options[$(this.parentNode).data($.editable.sSelfName + 'iOptionsID')];
    	},
    	getColumnName: function(oTable) {
    		return oTable.fnSettings().aoColumns[oTable.fnGetPosition(this)[2]].sName;
    	},

    	//make <select> editing
    	makeSelect: function(aSelectValues, sCurrentValue) {
    		sText = '<select>';
        	$.each(aSelectValues, function(key, value) {
        		if (value == sCurrentValue) {
        			sText += '<option value="' + key + '" selected="selected">' + value + '</option>';
        		}
        		else {
        			sText += '<option value="' + key + '">' + value + '</option>';
        		}
        	});
        	sText += '</select>';

        	return sText;
    	},

    	showOverlay: function(options, oTD) {
    		if (!options.oOverlay) {
    			if ($('#' + options.overlayClass).length) {//if we have overlay already (made by other editable()) - use it
    				options.oOverlay = $('#' + options.overlayClass).overlay();
    			}
    			else {
	    			options.oOverlay = $('<div class="' + options.overlayClass + '" id="' + options.overlayClass + '"></div>').appendTo('body')
	    			.overlay({
	    				top: '10%',
	    				speed: 'fast',
	    				closeOnClick: true,
	    				oneInstance: false,
	    				api: true
	    			});
    			}
    		}

    		//create normal 'show' overlay
    		if (oTD) {
    			$('#' + options.overlayClass).load(options.sModuleURL + 'show/' + options.oTable.fnGetData(oTD.parentNode)[0]);
    		}
    		//create modal dialog
    		else {
    			$('#' + options.overlayClass).load(options.sModuleURL + 'add/');
    		}

    		options.oOverlay.load();
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
    	createToolbar: function(options) {
			options.oTable.parent().find('div.dtBar')
				.html('<div class="ui-state-default ui-corner-all" style="padding: 4px;"><span class="ui-icon ui-icon-circle-plus"></span></div>')
				.children().hover(
		    		function() { $(this).addClass('ui-state-hover'); },
		    		function() { $(this).removeClass('ui-state-hover'); }
		    	);

			if (options.toolbar == 'modal') {
				options.oTable.parent().find('div.dtBar').find('.ui-icon-circle-plus').click(function(e) {
		            e.stopPropagation();//stop propagation because overlay may recieve this event and close
					$.editable.addRowModal(options);
				});
			}
			else if (options.toolbar !== false) {
				options.oTable.parent().find('div.dtBar').find('.ui-icon-circle-plus').click(function(){$.editable.addRowSampleData(options);});
			}
    	},

    	//modal dialog
    	addRowSampleData: function(options) {
    		var oSubmitData = {};

    		//add values to oSubmitData
			if (options.submitdata_add) {
				if ($.isFunction(options.submitdata_add)) {
					//pass DOM object to callback
                    $.extend(oSubmitData, options.submitdata_add(options.oTable));
                }
				else {
					$.extend(oSubmitData, options.submitdata_add);
                }
			}

    		$.post(options.sModuleURL + 'add', oSubmitData, function(sText, sStatus, oJSReq) {
    			($.editable.addRow(options, oJSReq.responseJS))
    			.children(':first').trigger($.editable.edit);
    		});
    	},

    	//modal dialog
    	addRowModal: function(options) {
    		$.editable.showOverlay(options);
    		//custom event after successufull insert
    		options.oTable.bind('eNewRow', function(e, aRowData) {
    			options.oOverlay.close();
    			$.editable.addRow(options, aRowData);
    		});
    	},

    	//add new row
    	addRow: function(options, aRowData) {
   			return $(options.oTable.fnGetNodes(options.oTable.fnAddData(aRowData)));
    	}
    };

	//default options used, assign selectColumns to get rid of annoying 'check object before check object property'
    $.editable.defaultOptions = { callback: $.editable.defaultCallback, submitdata: $.editable.defaultSubmitdata, selectColumns: {},
    	allowDetails: true, overlayClass: 'simple_overlay' };
    $.editable.edit = 'click.' + $.editable.sSelfName;

})(jQuery);