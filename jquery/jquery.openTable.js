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

    	//bind events
    	//filter
    	this.find('div.dataTables_filter input').keyup(function() {
			//filter data
			$.openTable.filterData(options, this.value);
        	//update body
        	$(this).parents('div.dDataTable').find('table tbody').html($.openTable.createTBody(options));
        	//update pager
        	$(this).parents('div.dDataTable').find('div.dataTables_paginate > span:nth-child(3)').html($.openTable.createPager(options));
        	//update info
        	$(this).parents('div.dDataTable').find('div.dataTables_info').html($.openTable.createInfo(options));

    		return false;
    	});

    	//records per page
    	this.find('div.dataTables_length select').change(function() {
    		options.oPager.iRecordsPerPage = this.value;
    		//set current page to 1
    		options.oPager.iCurrentPage = 1;
    		//recalculate total pages
    		options.oPager.iTotalPages = Math.ceil(options.oPager.iTotalRecords / options.oPager.iRecordsPerPage);
    		//update pager
        	$(this).parents('div.dDataTable').find('div.dataTables_paginate > span:nth-child(3)').html($.openTable.createPager(options));
        	//update body
        	$(this).parents('div.dDataTable').find('table tbody').html($.openTable.createTBody(options));
        	//update pager
        	$(this).parents('div.dDataTable').find('div.dataTables_paginate > span:nth-child(3)').html($.openTable.createPager(options));
        	//update info
        	$(this).parents('div.dDataTable').find('div.dataTables_info').html($.openTable.createInfo(options));

        	return false;
    	});

    	//pager
    	this.find('div.dataTables_paginate').click(function(e) {
    		var oSpan = $(e.target);
    		//if we clicked on not-td element
    		if (!oSpan.is('span')) return;

    		//select page, if we clicked on already active page - do nothing
    		if (!$.openTable.selectPage(options, oSpan)) return false;
        	//update body
        	$(this).parents('div.dDataTable').find('table tbody').html($.openTable.createTBody(options));
    		//update pager
        	$(this).parents('div.dDataTable').find('div.dataTables_paginate > span:nth-child(3)').html($.openTable.createPager(options));
        	//update info
        	$(this).parents('div.dDataTable').find('div.dataTables_info').html($.openTable.createInfo(options));

    		return false;
    	});

    	return this;
    };

    $.openTable = {
    	sSelfName: 'openTable',

    	sortData: function(options) {
	    	//column used for sorting
    		var iColumn = options.aaSorting[0][0];
    		//store sorted data in separate var
    		options.asData = options.aaData;
    		//sort array of data
    		options.asData.sort(function(a, b) {
    			if (a[iColumn] > b[iColumn]) {
    				return 1;
    			}
    			else {
    				return -1;
    			}
	    	});
	    	//reverse if order is desc
	    	if (options.aaSorting[0][1] === 'desc') {
	    		options.asData.reverse();
	    	}
    	},

    	filterData: function(options, sSearch) {
    		//feature - it searches in hidden columns too
    		//prepare search string - make it uppercase to avoid bugs with russian language - /i modifier do not work properly
    		if (sSearch) {
	    		sSearch = new RegExp(sSearch.toUpperCase(), 'i');
	    		options.afData = options.asData.filter(function(element) {
	    			for (var i = 0, iLength = element.length; i < iLength; i++) {
	    				if (element[i].search(sSearch) > -1) {
	        				return true;
	        			}
	    			}
	    			return false;
	    		});
    		}
    		else {
    			options.afData = options.asData;
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
    		var iCurrentPage;

    		if (mObj) {
    			//if parent is span container
	    		if (mObj.parent().is('span')) {
	    			//we clicked on already active element
	    			if (mObj.hasClass('paginate_active')) return false;

	    			//current page is clicked page minus active page plus current page
	    			iCurrentPage = mObj.index() - mObj.siblings('.paginate_active').index() + options.oPager.iCurrentPage;
	    		}
	    		else if (mObj.hasClass('first')) {
	    			iCurrentPage = 1;
	    		}
	    		else if (mObj.hasClass('previous')) {
	    			iCurrentPage = (options.oPager.iCurrentPage === 1 ? 1 : options.oPager.iCurrentPage - 1);
	    		}
	    		else if (mObj.hasClass('next')) {
	    			iCurrentPage = (options.oPager.iCurrentPage === options.oPager.iTotalPages ? options.oPager.iCurrentPage : options.oPager.iCurrentPage + 1);
	    		}
	    		else if (mObj.hasClass('last')) {
	    			iCurrentPage = options.oPager.iTotalPages;
	    		}
    		}

    		options.oPager.iCurrentPage = iCurrentPage;

    		return true;
    	},

    	createInfo: function(options) {
    		//options.oPager.iShownRecords
    		var sInfo = options.oLanguage.sInfo
    			.replace('_START_', (options.oPager.iCurrentPage - 1) * options.oPager.iRecordsPerPage + 1)
    			.replace('_END_', (options.oPager.iCurrentPage - 1) * options.oPager.iRecordsPerPage
    					+ options.afData.slice((options.oPager.iCurrentPage - 1) * options.oPager.iRecordsPerPage, options.oPager.iCurrentPage * options.oPager.iRecordsPerPage).length)
    			.replace('_TOTAL_', options.oPager.iTotalRecords);

    		return sInfo;
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
    			'<span class="first paginate_button">' + options.oLanguage.oPaginate.sFirst + '</span><span class="previous paginate_button">' + options.oLanguage.oPaginate.sPrevious + '</span><span>'
    			+ $.openTable.createPager(options) +
    			'</span><span class="next paginate_button">' + options.oLanguage.oPaginate.sNext + '</span><span class="last paginate_button">' + options.oLanguage.oPaginate.sLast + '</span></div>';
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

        	//create body
        	var sBody = $.openTable.createTBody(options);

        	return '<table cellpadding="0" cellspacing="0" border="0" class="' +  options.className + '">' + sHeader + '<tbody>' + sBody + '</tbody></table>';
    	}

    };

	//default options used
    $.openTable.defaultOptions = { className: 'display', oPager: { iRecordsPerPage: 10 }, oFeatures: { bFilter: true, bInfo: true, bLengthChange: true, bPaginate: true } };

})(jQuery);