/*
 * Store config here
 *
 */

var oModules = {
	people: '/people/',
	groups: '/groups/',
	payments: '/payments/',
	visits: '/visits/'
};

var oDataTableDefaults = {
	"aaSorting": [[1, 'asc']],
	//<"top"i>rt<"bottom"flp<"clear">
	"sDom": '<"top"<"dtBar">fi>rt<"bottom"lp<"clear">',
	"bStateSave": true,
	iCookieDuration: 86400,//one day
	sPaginationType: 'full_numbers',
	"oLanguage": {
		"sLengthMenu": "Выводить _MENU_ записей на страницу",
		"sProcessing": 'Работаем с данными',
		"sZeroRecords": "Нет такой буквы",
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
	"bJQueryUI": false
};