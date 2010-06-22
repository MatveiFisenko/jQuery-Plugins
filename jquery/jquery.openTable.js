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
 * Add support for case-insensitive sorting - add .toUpperCase() in sorting function and new param to options
 *
 * return oTable.fnSettings().aoColumns[oTable.fnGetPosition(this)[2]].sName;
 * options.oTable.fnGetData(oTD.parentNode)[0]
 * oTable.fnUpdate(sValue, aPos[0], aPos[2], false);
 * return $(options.oTable.fnAddDataAndDisplay(aRowData).nTr);
 * var iPosition = options.oTable.fnGetPositionByValue(aRowData[0], 0);
 * return $(options.oTable.fnGetNodes(iPosition));
 *
 * fnSettings() +
 * fnGetPosition() +
 * fnGetData() +
 * fnUpdate() +
 * fnAddDataAndDisplay()
 * fnGetPositionByValue()
 * fnGetNodes() +
 *
 *
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

    	options.oTable = this;

    	//mark this table as editable
    	this.data($.openTable.sSelfName, true);

    	//create surrounding divs and table itself
    	$.openTable.showTable.call(this, options);

    	//bind events
    	//filter
    	this.find('div.dataTables_filter input').keyup(function() {
			//filter data
			$.openTable.filterData(options, this.value);

			$.openTable.updateTable(options);

    		return false;
    	});

    	//records per page
    	this.find('div.dataTables_length select').change(function() {
    		options.oPager.iRecordsPerPage = this.value;
    		//set current page to 1
    		options.oPager.iCurrentPage = 1;
    		//recalculate total pages
    		options.oPager.iTotalPages = Math.ceil(options.oPager.iTotalRecords / options.oPager.iRecordsPerPage);

    		$.openTable.updateTable(options);

        	return false;
    	});

    	//pager
    	this.find('div.dataTables_paginate').click(function(e) {
    		var oSpan = $(e.target);
    		//if we clicked on not-td element
    		if (!oSpan.is('span')) return;

    		//select page, if we clicked on already active page - do nothing
    		if (!$.openTable.selectPage(options, oSpan)) return false;

    		$.openTable.updateTable(options);

    		return false;
    	});

    	//sorter
    	this.children('table').find('thead > tr').click(function(e) {
    		var oTh = $(e.target);
    		//if we clicked on not-th element
    		if (!oTh.is('th')) return;

    		//sort data
    		$.openTable.sortData(options, oTh.index());
    		//filter data
    		$.openTable.filterData(options, false);

    		$.openTable.updateTable(options);

    		//set active column
    		oTh.attr('class', options.aaSorting[0][1] === 'asc' ? 'sorting_asc' : 'sorting_desc')
    			.siblings('.sorting_asc, .sorting_desc').attr('class', 'sorting');

    		return false;
    	});

    	return {
    		options: options,

    		fnSettings: $.openTable.fnSettings,
    		fnGetPosition: $.openTable.fnGetPosition,
    		fnGetData: $.openTable.fnGetData,
    		fnUpdate: $.openTable.fnUpdate,
    		fnGetNodes: $.openTable.fnGetNodes
    	};
    };

    $.openTable = {
    	sSelfName: 'openTable',

    	sortData: function(options, iColumn) {
	    	//column used for sorting
    		if (isNaN(iColumn)) {
    			//used at startup
    			iColumn = options.aaSorting[0][0];
    		}
    		else {
    			//we need to check if we have hidden columns
    			$.openTable._getColumnHiddenIndex(options.aoColumns, iColumn);

    			//save current active column
    			if (options.aaSorting[0][0] !== iColumn) {
    				options.aaSorting[0] = [iColumn, 'asc'];
    			}
    			//flip asc/desc sorting
    			else {
    				options.aaSorting[0][1] = (options.aaSorting[0][1] === 'asc' ? 'desc' : 'asc');
    			}
    		}
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
    	},

    	//calculate column index including hidden columns
    	_getColumnHiddenIndex: function(aoColumns, iColumn) {
    		$.each(aoColumns, function(i) {
    			if (i < iColumn) {
    				//if column is before selected and not visible - increment our iColumn
    				if (!this.bVisible) {
    					iColumn++;
    				}
        		}
    			else {
    				return false;
    			}
    		});

    		return iColumn;
    	},

    	filterData: function(options, sSearch) {
    		//feature - it searches in hidden columns too
    		if (sSearch || (sSearch === false && options.oPager.mSearch)) {
    			//it can be false if we internally want to repeat filter using already existing sSearch - for example if we sort on another column
    			if (sSearch !== false) options.oPager.mSearch = sSearch;

    			//prepare search string - make it uppercase to avoid bugs with russian language - /i modifier do not work properly
	    		sSearch = new RegExp(options.oPager.mSearch.toUpperCase(), 'i');
	    		options.afData = options.aaData.filter(function(element) {
	    			for (var i = 0, iLength = element.length; i < iLength; i++) {
	    				if (element[i].search(sSearch) > -1) {
	        				return true;
	        			}
	    			}
	    			return false;
	    		});
    		}
    		else {
    			options.afData = options.aaData;
    			options.oPager.mSearch = false;
    		}

    		//recalculate pager data after each filter
			options.oPager.iCurrentPage = 1;
    		options.oPager.iTotalRecords = options.afData.length;
    		options.oPager.iTotalPages = Math.ceil(options.oPager.iTotalRecords / options.oPager.iRecordsPerPage);
    	},

    	createTBody: function(options) {
	    	//create table data
	    	var sBody = '';

	    	$.each(options.afData.slice((options.oPager.iCurrentPage - 1) * options.oPager.iRecordsPerPage, options.oPager.iCurrentPage * options.oPager.iRecordsPerPage), function(i, element) {
	    		sBody += '<tr class="' + (i % 2 ? 'even' : 'odd') + ' iID' + i + '">';

	    		//iterate throw array of data for <tr>
	    		$.each(this, function(i, element) {
	    			//check if column is visible
	    			if (options.aoColumns[i].bVisible) {
	        			sBody += '<td>' + element + '</td>';
	        		}
	    		});

	    		sBody += '</tr>';
	    	});

	    	//if nothing to show
	    	if (!sBody) sBody = '<tr class="odd"><td valign="top" colspan="' + options.aaData[0].length + '" class="dataTables_empty">' + options.oLanguage.sZeroRecords + '</td></tr>';

	    	return sBody;
    	},

    	createPager: function(options) {
    		var sPager = '', iStartPage, iEndPage;
    		//show 5 buttons
    		//calc start page
    		iStartPage = options.oPager.iCurrentPage - 2;
    		if (iStartPage < 1) iStartPage = 1;
    		//calc end page
    		iEndPage = iStartPage + 4;
    		if (iEndPage > options.oPager.iTotalPages) {
    			var iStartDiff = iStartPage - 1,//calc possible left shift
    				iEndDiff = iEndPage - options.oPager.iTotalPages;//calc needed left shift
    			//shift pages
    			while (iStartDiff-- > 0 && iEndDiff-- > 0) {
    				iStartPage--;
    				iEndPage--;
    			}
    			//if not possible to shift all pages to the left
    			if (iEndPage > options.oPager.iTotalPages) iEndPage = options.oPager.iTotalPages;
    		}

    		for (var i = iStartPage; i <= iEndPage; i++) {
    			sPager += '<span class="' + (i === options.oPager.iCurrentPage ? 'paginate_active' : 'paginate_button') + '">' + i + '</span>';
    		}

    		return sPager;
    	},

    	selectPage: function(options, mObj) {
			//if parent is span container
    		if (mObj.parent().is('span')) {
    			//we clicked on already active element
    			if (mObj.hasClass('paginate_active')) return false;

    			//current page is clicked page minus active page plus current page
    			options.oPager.iCurrentPage = mObj.index() - mObj.siblings('.paginate_active').index() + options.oPager.iCurrentPage;
    		}
    		else if (mObj.hasClass('first')) {
    			options.oPager.iCurrentPage = 1;
    		}
    		else if (mObj.hasClass('previous')) {
    			options.oPager.iCurrentPage = (options.oPager.iCurrentPage === 1 ? 1 : options.oPager.iCurrentPage - 1);
    		}
    		else if (mObj.hasClass('next')) {
    			options.oPager.iCurrentPage = (options.oPager.iCurrentPage === options.oPager.iTotalPages ? options.oPager.iCurrentPage : options.oPager.iCurrentPage + 1);
    		}
    		else if (mObj.hasClass('last')) {
    			options.oPager.iCurrentPage = options.oPager.iTotalPages;
    		}

    		return true;
    	},

    	createInfo: function(options) {
    		return options.oLanguage.sInfo
    			.replace('_START_', (options.oPager.iTotalRecords === 0 ? 0 : (options.oPager.iCurrentPage - 1) * options.oPager.iRecordsPerPage + 1))
    			.replace('_END_', (options.oPager.iCurrentPage - 1) * options.oPager.iRecordsPerPage
    					+ options.afData.slice((options.oPager.iCurrentPage - 1) * options.oPager.iRecordsPerPage, options.oPager.iCurrentPage * options.oPager.iRecordsPerPage).length)
    			.replace('_TOTAL_', options.oPager.iTotalRecords) + (options.oPager.mSearch ? ' ' + options.oLanguage.sInfoFiltered.replace('_MAX_', options.aaData.length) : '');
    	},

    	updateTable: function(options) {
    		//update body
        	options.oTable.children('table').children('tbody').html($.openTable.createTBody(options));
    		//update pager
        	options.oTable.find('div.dataTables_paginate > span:nth-child(3)').html($.openTable.createPager(options));
        	//update info
        	options.oTable.find('div.dataTables_info').html($.openTable.createInfo(options));
    	},

    	showTable: function(options) {
    		//sort & filter data
        	$.openTable.sortData(options);
        	$.openTable.filterData(options);

    		//compatibility with dataTables code
    		var nInsertNode = this;
    		/* Loop over the user set positioning and place the elements as needed */
			var aDom = options.sDom.split('');

			var nTmp, iPushFeature, cOption, cNext, sClass, j;
			for ( var i = 0, iLength = aDom.length ; i < iLength ; i++ )
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
				else if ( cOption == 'l' && options.oFeatures.bPaginate && options.oFeatures.bLengthChange )
				{
					/* Length */
					nTmp = $.openTable._fnFeatureHtmlLength( options );
					iPushFeature = 1;
				}
				else if ( cOption == 'f' && options.oFeatures.bFilter )
				{
					/* Filter */
					nTmp = $.openTable._fnFeatureHtmlFilter( options );
					iPushFeature = 1;
				}
				else if ( cOption == 'r' && options.oFeatures.bProcessing )
				{
					/* pRocessing */
					//do nothing
				}
				else if ( cOption == 't' )
				{
					/* Table */
					nTmp = $.openTable._fnFeatureHtmlTable( options );
					iPushFeature = 1;
				}
				else if ( cOption ==  'i' && options.oFeatures.bInfo )
				{
					/* Info */
					nTmp = $.openTable._fnFeatureHtmlInfo( options );
					iPushFeature = 1;
				}
				else if ( cOption == 'p' && options.oFeatures.bPaginate )
				{
					/* Pagination */
					nTmp = $.openTable._fnFeatureHtmlPaginate( options );
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
    		return '<div class="dataTables_info">' + $.openTable.createInfo(options) + '</div>';
    	},

    	_fnFeatureHtmlPaginate: function(options) {
    		return '<div class="dataTables_paginate paging_full_numbers">' +
    			'<span class="first paginate_button">' + options.oLanguage.oPaginate.sFirst + '</span><span class="previous paginate_button">'
    			+ options.oLanguage.oPaginate.sPrevious + '</span><span>' + $.openTable.createPager(options) + '</span><span class="next paginate_button">'
    			+ options.oLanguage.oPaginate.sNext + '</span><span class="last paginate_button">' + options.oLanguage.oPaginate.sLast + '</span></div>';
    	},

    	_fnFeatureHtmlTable: function(options) {
    		//create table header
        	var sHeader = '';

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

        	return '<table cellpadding="0" cellspacing="0" border="0" class="' +  options.className + '"><thead><tr>' + sHeader + '</tr></thead><tbody>'
        		+ $.openTable.createTBody(options) + '</tbody></table>';
    	},

    	//user accessible functions

    	//only aoColumns are returned
    	fnSettings: function() {
    		return { aoColumns: this.options.aoColumns };
    	},

    	//tr, td are supported
    	fnGetPosition: function(oEl) {
    		oEl = $(oEl);

    		if (oEl.is('td')) {
    			return [ $.openTable._getRowID(oEl.parent()), oEl.index(), $.openTable._getColumnHiddenIndex(this.options.aoColumns, oEl.index()) ];
    		}
    		else {
    			return [ $.openTable._getRowID(oEl) ];
    		}
    	},

    	//tr, int and nothing are supported
    	fnGetData: function(oTR) {
    		if (oTR.nodeName && oTR.nodeName.toUpperCase() === 'TR') {
	    		return this.options.aaData[ $.openTable._getRowID($(oTR)) ];
    		}
    		else if (!isNaN(oTR)) {
    			return this.options.aaData[ $oTR ];
    		}
    		else {
    			return this.options.aaData;
    		}
    	},

    	fnUpdate: function(mData, mRow, iColumn, bRedraw) {
    		var oTR;
    		//if it is not int
    		if (isNaN(mRow)) {
    			oTR = $(mRow);

    			mRow = this.fnGetPosition(mRow);
    		}
    		else {
    			//because nth-child starts from 1
    			oTR = this.options.oTable.children('table').find('tr:nth-child(' + (mRow + 1) +')');
    		}
    		console.log(mRow);

    		if ($.isArray(mData)) {
    			this.options.aaData[ mRow ] = mData;

    			$.each(mData, function(i) {
    				oTR.child('td:nth-child(' + (i + 1) +')').html(this);
    			});

    			return 0;
    		}
    		else if (!isNaN(iColumn)) {
    			this.options.aaData[ mRow ][ iColumn ] = mData;
    			oTR.children('td:nth-child(' + (iColumn + 1) +')').html(mData);

    			return 0;
    		}

    	},

    	//only call using iID supported
    	fnGetNodes: function(iID) {
    		if (!isNaN(iID)) {
    			return this.options.oTable.children('table').find('tr.iID' + iID)[0];
    		}

    	},

    	_getRowID: function(oTR) {
    		return +oTR.attr('class').match(/iID(\d+)/)[1];
    	}

    };

	//default options used
    $.openTable.defaultOptions = { className: 'display', oPager: { iRecordsPerPage: 10 }, oFeatures: { bFilter: true, bInfo: true, bLengthChange: true, bPaginate: true } };

})(jQuery);