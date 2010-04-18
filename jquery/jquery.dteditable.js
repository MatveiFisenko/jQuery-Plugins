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
  * @param String		target					(POST) URL or function to send edited content to. *
  * @param Hash			options					Additional options.
  * @param Object		options[oTable] 		DataTables object. *
  * @param Function		options[callback]		Function to run after submitting edited content.
  * @param Hash			options[submitdata]		Extra parameters to send when submitting edited content. Can be function returning hash.
  * @param Hash			options[submitdata_add]	Extra parameters to send when adding new row. Can be function returning hash. Property _sTableID is reserved for internal use.
  * @param mixed		options[toolbar]		Create toolbar. Default true. 'modal' - modal add event, false - don't create.
  * @param Hash			options[selectColumns]	Values for creating <select> edits. Format: { columnName: {0: 'edit1', 1:'edit2' } }
  * @param Bool			options[allowDetails]	Create overlay on dblclick event. Default true.
  * @param String		options[overlayClass]	Used to specify overlay class. Default simple_overlay. Be carefull - it is used as #id too!
  * @param Array/false	options[disableEdit]	Disable editing of several table columns. Starting from 0. Example: [0, 1]. If false - disable edit all.
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

    	if (options.disableEdit !== true)
    	this.children('tbody').bind('click.' + $.editable.sSelfName, function(e) {
    		var oTD = $(e.target);
    		//if we clicked on not-td element
    		if (!oTD.is('td')) return;

    		var options = $.editable.getStoredOptions.call(this);

    		//if current element is in disabled list
    		if ($.inArray(oTD.prevAll().length, options.disableEdit) > -1) return;

    		//if we already edit this element
    		if (oTD.data($.editable.sSelfName + 'bEditing')) return;

//          e.preventDefault();//because overlays do not get click event
            e.stopPropagation();

            //save current data
            oTD.data($.editable.sSelfName + 'sOldText', oTD[0].innerHTML);

            var sText, sColumnName = $.editable.getColumnName.call(oTD[0], options.oTable);
            //work with special columns
            if (options.selectColumns[sColumnName]) {
            	sText = $.editable.makeSelect(options.selectColumns[sColumnName], oTD.data($.editable.sSelfName + 'sOldText'));
            }
            else {
            	sText = '<input type="text" class="ui-state-active ui-corner-all" value="' + oTD[0].innerHTML + '" />';
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
    					//get real new value
    					sText = oJSReq.responseJS;
    					//if we edited special column
	    				if (options.selectColumns[oSubmitData.sColumnName]) {
							sText = options.selectColumns[oSubmitData.sColumnName][parseInt(sText)];
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
    	sTableID: null,


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
	    				top: options.overlayClass == 'sub_overlay' ? '15%' : '10%',
	    				speed: 'fast',
	    				closeOnClick: true,
	    				oneInstance: false,
	    				api: true
	    			});
    			}
    		}

    		var sPath;
    		//open normal 'show' overlay
    		if (oTD.nodeName) {
    			sPath = options.sModuleURL + 'show/' + options.oTable.fnGetData(oTD.parentNode)[0];
    		}
    		//open modal dialog
    		else {
    			sPath = options.sModuleURL + 'add/' + oTD;
    		}
    		$.get(sPath, function(sText, sStatus, oJS) {
    			//check if we sent request with table ID. Used for form sending event to this specific table.
    			var sTableID = oJS._openArgs.url.match(/_sTableID=([a-z0-9]+)/i);
    			//limitation - only one modal add dialog in a moment!
    			if (sTableID) {
    				$.editable.sTableID = sTableID[1];
    			}

    			$('#' + options.overlayClass).html(oJS.responseJS.sPageContents);
    			options.oOverlay.load();
    		});
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
		    	)
				.find('.ui-icon-circle-plus').click(function(e){ $.editable.addRowHandler(e, options); });
    	},

    	//do addRow action
    	addRowHandler: function(e, options) {
    		//parse submitdata, it will be added to request as query string
    		var sSubmitData = {};
    		if (options.submitdata_add) {
    			sSubmitData = options.submitdata_add;

				if ($.isFunction(sSubmitData)) {
					//pass Datatables object to callback
					sSubmitData = sSubmitData(options.oTable);
                }
			}
    		//set table id - we use it in form for sending event to this specific table
			sSubmitData._sTableID = options.oTable[0].id;
			sSubmitData = '?' + $.param(sSubmitData);

			if (options.toolbar == 'modal') {
				e.stopPropagation();//stop propagation because overlay may recieve this event and close

				$.editable.showOverlay(options, sSubmitData);
	    		//custom event after successufull insert, bind only once
				if (!(options.oTable.data('events') && options.oTable.data('events').eNewRow))
	    		options.oTable.bind('eNewRow', function(e, aRowData) {
	    			options.oOverlay.close();
	    			$.editable.addRow(options, aRowData);
	    		});
			}
			else {
				$.post(options.sModuleURL + 'add/' + sSubmitData, oSubmitData, function(sText, sStatus, oJSReq) {
	    			($.editable.addRow(options, oJSReq.responseJS))
	    			.children(':first').trigger($.editable.edit);
	    		});
			}
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