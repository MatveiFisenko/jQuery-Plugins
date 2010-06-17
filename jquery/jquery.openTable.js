/*
 * Table - tables plugin for jQuery.
 *
 * Copyright (c) 2010 mot <2matvei@gmail.com>
 *
 * Licensed under the GPLv3 license:
 *   http://www.opensource.org/licenses/gpl-3.0.html
 *
 * Project home:
 *   http://www.matvei.ru
 *
 * Inspired by DataTables
 *    http://datatables.net
 *
 */
/**
  * Version 0.1
  *
  * '*' - mandatory
  * @name  table
  * @type  jQuery
  * @param Hash			options					Additional options.
  *
  */

/*
 * TODO:
 *
 */

(function($) {

    $.fn.openTable = function(options) {
    	//if options are unset - make empty object
    	options = options || {};

    	//if we made it editable already - return
    	if (this.data($.openTable.sSelfName)) return this;

    	//merge options with default ones
    	options = $.extend({}, $.openTable.defaultOptions, options);

    	//mark this table as editable
    	this.data($.openTable.sSelfName, true);

    	//create surrounding divs and table itself
    	$.openTable.showTable.call(this, options);

    	return this;
    };

    $.openTable = {
    	sSelfName: 'openTable',

    	sortData: function(options) {
	    	//column used for sorting
    		var iColumn = options.aaSorting[0][0];
    		//sort array of data
	    	options.aaData.sort(function(a, b) {
    			if (a[iColumn] > b[iColumn]) {
    				return 1;
    			}
    			else {
    				return -1;
    			}
	    	});
	    	//reverse if order is desc
	    	if (options.aaSorting[0][1] === 'desc') {
	    		options.aaData.reverse();
	    	}

	    	//return only 'recordsPerPage' rows
	    	return options.aaData.slice(0, options.recordsPerPage);
    	},

    	createTBody: function (options, oData) {
	    	//create table data
	    	var sBody = '<tbody>';

	    	$.each(oData, function(i, element) {
	    		sBody += '<tr class="' + (i % 2 ? 'odd' : 'even') + '">';

	    		//iterate throw array of data for <tr>
	    		$.each(this, function(i, element) {
	    			//check if column is visible
	    			if (options.aoColumns[i].bVisible) {
	        			sBody += '<td>' + element + '</td>';
	        		}
	    		});

	    		sBody += '</tr>';
	    	});

	    	sBody += '</tbody>';

	    	return sBody;
    	},

    	showTable: function(options) {
    		//compatibility with dataTables code
    		var nInsertNode = this, oSettings = options;
    		/* Loop over the user set positioning and place the elements as needed */
			var aDom = options.sDom.split('');

			var nTmp, iPushFeature, cOption, nNewNode, cNext, sClass, j;
			for ( var i=0 ; i<aDom.length ; i++ )
			{
				iPushFeature = 0;
				cOption = aDom[i];

				if ( cOption == '<' )
				{
					/* New container div */

					/* Check to see if we should append a class name to the container */
					cNext = aDom[i+1];
					if ( cNext == "'" || cNext == '"' )
					{
						sClass = "";
						j = 2;
						while ( aDom[i+j] != cNext )
						{
							sClass += aDom[i+j];
							j++;
						}
						i += j; /* Move along the position array */
					}

					nInsertNode = $('<div class="' + sClass + '"></div>').appendTo(nInsertNode);
				}
				else if ( cOption == '>' )
				{
					/* End container div */
					nInsertNode = nInsertNode.parent();
				}
				else if ( cOption == 'l' && oSettings.oFeatures.bPaginate && oSettings.oFeatures.bLengthChange )
				{
					/* Length */
					nTmp = $.openTable._fnFeatureHtmlLength( oSettings );
					iPushFeature = 1;
				}
				else if ( cOption == 'f' && oSettings.oFeatures.bFilter )
				{
					/* Filter */
					nTmp = $.openTable._fnFeatureHtmlFilter( oSettings );
					iPushFeature = 1;
				}
				else if ( cOption == 'r' && oSettings.oFeatures.bProcessing )
				{
					/* pRocessing */
					//do nothing
				}
				else if ( cOption == 't' )
				{
					/* Table */
					nTmp = $.openTable._fnFeatureHtmlTable( oSettings );
					iPushFeature = 1;
				}
				else if ( cOption ==  'i' && oSettings.oFeatures.bInfo )
				{
					/* Info */
					nTmp = $.openTable._fnFeatureHtmlInfo( oSettings );
					iPushFeature = 1;
				}
				else if ( cOption == 'p' && oSettings.oFeatures.bPaginate )
				{
					/* Pagination */
					nTmp = $.openTable._fnFeatureHtmlPaginate( oSettings );
					iPushFeature = 1;
				}

				/* Add to the 2D features array */
				if ( iPushFeature == 1 )
				{
					nInsertNode.append(nTmp);
				}
			}

    	},

    	_fnFeatureHtmlLength: function(options) {
    		var sSelect = '<select><option value="10">10</option><option value="25">25</option><option value="50">50</option><option value="100">100</option></select>';
    		return '<div class="dataTables_length">' + options.oLanguage.sLengthMenu.replace('_MENU_', sSelect) + '</div>';
    	},

    	_fnFeatureHtmlFilter: function(options) {
    		return '<div class="dataTables_filter">' + options.oLanguage.sSearch + ' <input type="text" class="ui-state-active ui-corner-all"></div>';
    	},

    	_fnFeatureHtmlInfo: function(options) {
    		return '<div class="dataTables_info">' + options.oLanguage.sInfo + 'TODO</div>';
    	},

    	_fnFeatureHtmlPaginate: function(options) {
    		return '<div class="dataTables_paginate paging_full_numbers">' + 'TODO' + '</div>';
    	},

    	_fnFeatureHtmlTable: function(options) {
    		//create table header
        	var sHeader = '<thead><tr>';

        	$.each(options.aoColumns, function(i) {
        		//normalize aoColumns
        		if (typeof(this.bVisible) === 'undefined') {
        			this.bVisible = true;
        		}
        		if (this.bVisible) {
        			//create sorting class
        			sHeader += '<th class="' + (i == options.aaSorting[0][0] ? (options.aaSorting[0][1] !== 'desc' ? 'sorting_asc' : 'sorting_desc') : 'sorting')
        					+ '" width="' + this.sWidth + '">' + this.sTitle + '</th>';
        		}
        	});

        	sHeader +='</tr></thead>';

        	//prepare data for body
        	var oData = $.openTable.sortData(options);
        	//create body
        	var sBody = $.openTable.createTBody(options, oData);

        	return '<table cellpadding="0" cellspacing="0" border="0" class="' +  options.className + '">' + sHeader + sBody + '</table>';
    	}

    };

	//default options used
    $.openTable.defaultOptions = { className: 'display', recordsPerPage: 10, oFeatures: { bFilter: true, bInfo: true, bLengthChange: true, bPaginate: true } };

})(jQuery);