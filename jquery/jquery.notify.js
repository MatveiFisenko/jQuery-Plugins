/*
 * notify - jQuery notifying library.
 * Show test for 1500 ms.
 *
 * Copyright (c) 2010 mot <2matvei@gmail.com>
 *
 * Licensed under the GPLv3 license:
 *   http://www.opensource.org/licenses/gpl-3.0.html
 *
 * Project home:
 *   http://www.matvei.ru
 */
/**
  * Version 0.1
  *
  * @name  notify
  * @type  jQuery
  * @param String		mText					Text to show. Can be hash key, see 'messages'.
  * @param Bool			bPersistent				Do not hide message after 1500 ms. Default false.
  * @param jQuery/DOM	mPlace					Div where to show text. Default is div.notify appended to document.body.
  *
  */

/*
 * TODO:
 *
 */

(function($) {

	$.notify = {
		obj: null,
		debugObg: null,
		messages: { updated: 'Информация обновлена.', added: 'Новая запись добавлена.', success: 'Операция выполнена успешно!', error: 'Произошла ошибка, попробуйте ещё раз позднее.' },


		show: function(mText, bPersistent, mPlace) {
			if (mPlace) {
				$.notify.obj = $(mPlace);
			}
			else if (!$.notify.obj) {
				$.notify.obj = $('<div class="notify ui-state-highlight ui-corner-all"></div>').appendTo(document.body);
			}

			$.notify.obj.toggleClass('ui-state-error', mText === 'error' ? true : false).html($.notify.messages[mText] || mText).show().delay(1500).fadeOut();

			if (bPersistent) {
				//clear effects queue
				$.notify.obj.clearQueue();
			}
		},

		showDebug: function(sText) {
			if (!$.notify.debugObg) {
				$.notify.debugObg = $('<div id="debug"></div>').appendTo(document.body);
			}

			$.notify.debugObg.prepend('<pre>' + sText + '</pre>');
		}
	};

})(jQuery);