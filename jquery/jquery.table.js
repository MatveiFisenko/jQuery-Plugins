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
    	if ($(this).data($.openTable.sSelfName)) return this;

    	//merge options with default ones
    	options = $.extend({}, $.openTable.defaultOptions, options);

    	//mark this table as editable
    	$(this).data($.openTable.sSelfName, true);

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

    	//create table with only header
    	var oTable = $('<table cellpadding="0" cellspacing="0" border="0" class="' +  options.className + '">' + sHeader + '</table>').appendTo(this);

    	//create surrounding divs
    	$.openTable.createSurrounding.call(this, options);

    	var oData = $.openTable.sortData(options);
    	var sBody = $.openTable.createTBody(options, oData);

    	oTable.append(sBody);

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

    	createSurrounding: function(options) {
    		//compatibility with dataTables code
    		var nInsertNode = $('<div></div>').prependTo(this)[0];
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
					nNewNode = document.createElement( 'div' );

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
						nNewNode.className = sClass;
						i += j; /* Move along the position array */
					}

					nInsertNode.appendChild( nNewNode );
					nInsertNode = nNewNode;
				}
				else if ( cOption == '>' )
				{
					/* End container div */
					nInsertNode = nInsertNode.parentNode;
				}
				else if ( cOption == 'l' && oSettings.oFeatures.bPaginate && oSettings.oFeatures.bLengthChange )
				{
					/* Length */
					nTmp = _fnFeatureHtmlLength( oSettings );
					iPushFeature = 1;
				}
				else if ( cOption == 'f' && oSettings.oFeatures.bFilter )
				{
					/* Filter */
					nTmp = _fnFeatureHtmlFilter( oSettings );
					iPushFeature = 1;
				}
				else if ( cOption == 'r' && oSettings.oFeatures.bProcessing )
				{
					/* pRocessing */
					nTmp = _fnFeatureHtmlProcessing( oSettings );
					iPushFeature = 1;
				}
				else if ( cOption == 't' )
				{
					/* Table */
					nTmp = oSettings.nTable;
					iPushFeature = 1;
				}
				else if ( cOption ==  'i' && oSettings.oFeatures.bInfo )
				{
					/* Info */
					nTmp = _fnFeatureHtmlInfo( oSettings );
					iPushFeature = 1;
				}
				else if ( cOption == 'p' && oSettings.oFeatures.bPaginate )
				{
					/* Pagination */
					nTmp = _fnFeatureHtmlPaginate( oSettings );
					iPushFeature = 1;
				}
				else if ( _oExt.aoFeatures.length !== 0 )
				{
					/* Plug-in features */
					var aoFeatures = _oExt.aoFeatures;
					for ( var k=0, kLen=aoFeatures.length ; k<kLen ; k++ )
					{
						if ( cOption == aoFeatures[k].cFeature )
						{
							nTmp = aoFeatures[k].fnInit( oSettings );
							if ( nTmp )
							{
								iPushFeature = 1;
							}
							break;
						}
					}
				}

				/* Add to the 2D features array */
				if ( iPushFeature == 1 )
				{
					if ( typeof oSettings.aanFeatures[cOption] != 'object' )
					{
						oSettings.aanFeatures[cOption] = [];
					}
					oSettings.aanFeatures[cOption].push( nTmp );
					nInsertNode.appendChild( nTmp );
				}
			}

    	}

    };

	//default options used
    $.openTable.defaultOptions = { className: 'display', recordsPerPage: 10 };

})(jQuery);