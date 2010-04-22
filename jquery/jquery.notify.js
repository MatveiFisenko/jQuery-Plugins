/*
 * notify - jQuery notifying library.
 * Ported from xhrForm.
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
  * @param Hash		options					additional options
  *
  */

/*
 * TODO:
 *
 */

(function($) {

	$.notify = {
		obj: null,
		messages: { updated: 'Информация обновлена.', added: 'Новая запись добавлена.', success: 'Операция выполнена успешно!', error: 'Произошла ошибка, попробуйте ещё раз позднее.' },


		show: function(mText, bError, mPlace) {
			bError = !!bError;//convert to bool

			if (mPlace) {
				$.notify.obj = $(mPlace);
			}
			else if (!$.notify.obj) {
				$.notify.obj = $('<div class="notify ui-state-highlight ui-corner-all"></div>').appendTo(document.body);
			}

			$.notify.obj.toggleClass('ui-state-error', bError).html($.notify.messages[mText] || mText).show().delay(1500).fadeOut();
		}
	};

})(jQuery);