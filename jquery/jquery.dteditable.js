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
  * @param String		options[editModule]		Module name where to send edited content. Default is target.
  * @param String		options[showModule]		Module name where to send show requests. Default is target.
  * @param Hash			options[submitdata_add]	Extra parameters to send when adding new row. Can be function returning hash. Property _sTableID is reserved for internal use.
  * @param mixed		options[toolbar]		Create toolbar. Default true. 'modal' - modal add event, false - don't create.
  * @param Hash			options[selectColumns]	Values for creating <select> edits. Format: { columnName: {0: 'edit1', 1:'edit2' } }
  * @param Bool			options[disableDetails]	Create 'show' overlay on dblclick event. Default false.
  * @param String		options[showUrl]		Action for 'show' overlay on dblclick event. Default 'show'.
  * @param Array/bool	options[disableEdit]	Disable editing of several table columns. Starting from 0. Example: [0, 1]. If true - disable edit all. Default false.
  * @param Object		options[overlay]		Params for overlay. Currently supports only history (bool).
  *
  */

/*
 * TODO:
 * possible change events click -> dblclick and vice versa
 * submit bug report about e.preventDefault() and e.stopPropagation() - it makes no sense when work with overlay;
 * better work with select inputs
 * use eventData in bind when work with toolbar etc
 *
 */

(function($) {

    $.fn.editable = function(target, options) {
    	//if options are unset - make empty object
    	options = options || {};

    	//we keep target only for compatibility with editable
    	options.sModuleURL = target;

    	//set editModule
    	options.editModule = options.editModule || target;

    	//set showModule
    	options.showModule = options.showModule || target;

    	//if we pass DataTables object directly
    	if (this.fnUpdate) options.oTable = this;
    	//if we have no oTable - do nothing
    	else if (!options.oTable) return false;

    	//if we made it editable already - return
    	if (options.oTable.data($.editable.sSelfName)) return this;

    	//if we have selectColumns - prepare them
    	if (options.selectColumns) {
    		$.each(options.selectColumns, function(i, element) {
    			if (!element.change) {
    				options.selectColumns[i] = { values: element, change: null };
    			}
    		});
    	}

    	//merge options with default ones
    	options = $.extend({}, $.editable.defaultOptions, options);

    	//mark this table as editable
    	options.oTable.data($.editable.sSelfName, true);

    	//create toolbar
    	if (options.toolbar !== false) {
    		$.editable.createToolbar(options);
    	}

    	if (options.disableEdit !== true)
    	this.children('tbody').bind('click.' + $.editable.sSelfName, function(e) {
    		var oTD = $(e.target);
    		//if we clicked on not-td element
    		if (!oTD.is('td')) return;

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
            	//if we have check function and it returns not true
            	if ($.isFunction(options.selectColumns[sColumnName].change) && !options.selectColumns[sColumnName].change.call(oTD[0], options.oTable)) {
       				return;
        		}
           		sText = $.editable.makeSelect(options.selectColumns[sColumnName].values, oTD.data($.editable.sSelfName + 'sOldText'));
            }
            else {
            	sText = '<input type="text" class="ui-state-active ui-corner-all" value="' + oTD[0].innerHTML + '" style="width: ' + oTD.width() + 'px;" />';
            }

            oTD.html(sText)
            	.data($.editable.sSelfName + 'bEditing', true)
            	.children().focus();

    		$.editable.setTimeout(oTD);
    	});

    	if (options.disableEdit !== true)
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

    			if (options.submitdata) {
    				if ($.isFunction(options.submitdata)) {
    					//pass DOM object to callback
                        $.extend(oSubmitData, options.submitdata.call(oTD[0], options.oTable));
                    }
    				else {
    					$.extend(oSubmitData, options.submitdata);
                    }
    			}

    			$.post(options.editModule + 'update', oSubmitData, $.proxy(function (sText) {
    					//get real new value
    					//if we edited special column
	    				if (options.selectColumns[oSubmitData.sColumnName]) {
	    					//selectColumns can contain hash, to check if sText is string
							sText = options.selectColumns[oSubmitData.sColumnName].values[ isNaN(sText) ? sText : parseInt(sText) ];
						}
    					$.editable.setText(oTD, sText);

    					if ($.isFunction(options.callback)) {
    						//pass DOM object to callback
    						options.callback.call(oTD[0], sText, options.oTable);
    					}

    					$.notify.show('updated');
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

    	if (options.disableDetails !== true)
    	this.children('tbody').bind('dblclick.' + $.editable.sSelfName, function(e) {
    		if (!$(e.target).is('td, input')) return;

    		//find current TD
    		var oTD = $(e.target).is('td') ? e.target : e.target.parentNode;

    		$.editable.showOverlay(options, oTD);
    	});

    	//bind event for handling table row update calls
    	$.editable.bindTableRowEvent(options);

    	return this;
    };

    $.editable = {
    	sSelfName: 'dteditable',
    	sTableID: null,
    	sParentTableID: null,


   		setTimeout: function(e) {
    		$.editable.clearTimeout(e);

    		e.data($.editable.sSelfName + 'iTimeoutID', setTimeout(function() {$.editable.setText(e);}, 4000));
    	},
    	clearTimeout: function(e) {
    		clearTimeout(e.data($.editable.sSelfName + 'iTimeoutID'));
    	},
    	setText: function(e, sText) {
    		e.html(sText || e.data($.editable.sSelfName + 'sOldText')).removeData($.editable.sSelfName + 'bEditing');
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
    		//now we have one 1 main overlay and 1 modal overlay. main overlay is with history support
    		options.oOverlay = $.overlay2.create({
    			className: oTD.nodeName ? 'simple_overlay' : 'sub_overlay', top: oTD.nodeName ? $(oTD).offset().top : '15%',
    			//we added option to override default behaviour - now we can disable history for main overlay
    			history: oTD.nodeName ? options.overlay.history : false
    		});

    		var sPath;
    		//open normal 'show' overlay
    		if (oTD.nodeName) {
    			//send table ID as param. Used if we edit main object in show dialog
    			sPath = options.showModule + options.showUrl + '/' + options.oTable.fnGetData(oTD.parentNode)[0] + '?' + $.param({ _sParentTableID: options.oTable[0].id });
    		}
    		//open modal dialog
    		else {
    			sPath = options.sModuleURL + 'add/' + oTD;
    		}
    		$.get(sPath, function(sText) {
    			//check if we sent request with table ID. Used for form sending event to this specific table.
    			var sTableID = this.url.match(/_sTableID=([a-z0-9]+)/i);
    			//limitation - only one modal add dialog in a moment!
    			if (sTableID) {
    				$.editable.sTableID = sTableID[1];
    			}

    			//check if we sent request with table ID. Used for form sending event to this specific table.
    			var sParentTableID = this.url.match(/_sParentTableID=([a-z0-9]+)/i);
    			//limitation - only one show dialog in a moment!
    			if (sParentTableID) {
    				$.editable.sParentTableID = sParentTableID[1];
    			}

    			options.oOverlay.html(sText.sPageContents, this.url);
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
				//all processing will be held in bindTableRowEvent
			}
			else {
				$.post(options.sModuleURL + 'add/' + sSubmitData, oSubmitData, function(sText) {
	    			($.editable.addRow(options, sText))
	    			.children(':first').trigger($.editable.edit);

	    			$.notify.show('added');
	    		});
			}
    	},

    	//add new row
    	addRow: function(options, aRowData) {
   			return $(options.oTable.fnAddDataAndDisplay(aRowData).nTr);
    	},
    	//edit existing row
    	editRow: function(options, aRowData) {
    		var iPosition = options.oTable.fnGetPositionByValue(aRowData[0], 0);
    		options.oTable.fnUpdate(aRowData, iPosition, false);
   			return $(options.oTable.fnGetNodes(iPosition));
    	},

    	//bind event used for row adding/editing
    	bindTableRowEvent: function(options) {
    		//custom event after successufull insert, bind only once
			if (!(options.oTable.data('events') && options.oTable.data('events').eNewRow))
    		options.oTable.bind('eNewRow', function(e, aRowData, bEdit) {
    			//see jquery.form.js
    			if (bEdit) {
    				$.editable.editRow(options, aRowData);

    				$.notify.show('updated');
    			}
    			else {
    				options.oOverlay.close();
    				($.editable.addRow(options, aRowData)).addClass('ui-state-highlight');

    				$.notify.show('added');
    			}
    		});
    	}
    };

	//default options used, assign selectColumns to get rid of annoying 'check object before check object property'
    $.editable.defaultOptions = { callback: $.editable.defaultCallback, submitdata: $.editable.defaultSubmitdata, selectColumns: {}, showUrl: 'show',
    	overlay: { history: true }
    };
    $.editable.edit = 'click.' + $.editable.sSelfName;

})(jQuery);