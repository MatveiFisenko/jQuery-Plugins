/**
 * Event handlers used everywhere
 */

$(function() {
	$('body').ajaxSuccess(function(e, oJSReq, request, data) {
		$.notify.showDebug(data.debugText);
	});

	$('body').ajaxError(function(e, oJSReq) {
		$.notify.showDebug($.parseJSON(oJSReq.responseText).debugText);
		//we have global error
		$.notify.show('error');
	});
});

/*
 * Store config here
 *
 */
var oDataTableDefaults = {
	"aaSorting": [[1, 'asc']],
	//<"top"i>rt<"bottom"flp<"clear">
	"sDom": '<"top"<"dtBar">fi>rt<"bottom"lp<"clear">',
	"bStateSave": false,
	iCookieDuration: 86400,//one day
	sPaginationType: 'full_numbers',
	"oLanguage": {
		"sLengthMenu": "Выводить _MENU_ записей на страницу",
		"sProcessing": 'Работаем с данными',
		"sZeroRecords": "Нет таких записей",
		"sInfo": "Вывожу с _START_ по _END_ из _TOTAL_ записей",
		"sInfoEmpty": "Вывожу с 0 по 0 из 0 записей",
		"sInfoFiltered": "(найдено из _MAX_ записей)",
		"sInfoPostFix": "",
		"sSearch": "Поиск:",
		"oPaginate": {
			"sFirst": "Первая",
			"sLast": "Последняя",
			"sNext": ">",
			"sPrevious": "<"
		}
	},
//	"bProcessing": true
	"bJQueryUI": false,
	"bAutoWidth": false
};

var _Defaults = {

	DataTable: oDataTableDefaults,

	Tooltip: {
		// place tooltip on the right edge
		position: "center right",
		// a little tweaking of the position
		offset: [0, 10],
		// use the built-in fadeIn/fadeOut effect
		effect: "fade",
		// custom opacity setting
		opacity: 0.7,

		events: {
			//show tooltip on input mouseenter
			input: 'focus mouseenter, blur mouseleave'
		}
	}

};
