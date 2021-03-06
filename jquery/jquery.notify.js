/*
 * notify - jQuery notifying library.
 * Show text pop-ups for 4000 ms.
 * Every new function call results in new pop-up.
 *
 * Copyright (c) 2010 mot <2matvei@gmail.com>
 *
 * Licensed under the AGPLv3 license:
 *   http://www.opensource.org/licenses/agpl-v3.html
 *
 * Project home:
 *   http://www.matvei.ru
 */
/**
  * Version 0.2
  *
  * @name  notify
  * @type  jQuery
  * @param String		mText					Text to show. Can be hash key, see 'messages'.
  * @param Bool			bPersistent				Do not hide message after 4000 ms. Default false.
  * @param jQuery/DOM	mPlace					jQuery/DOM/Selector to append div.notify to. Default div.notify is appended to document.body.
  * @param Bool			bError					Apply error style class or not. Default false.
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


		show: function(mText, bPersistent, mPlace, bError) {
			//if we provide place to append notify - use it, else append to body
			if (!mPlace) mPlace = 'body';

			mPlace = $(mPlace);

			//if object not exist or if div.notify was never attached to mPlace - attach it. If is was attached - assign it.
			if (!$.notify.obj || !($.notify.obj = mPlace.children('div.notifyContainer')).length) {
				$.notify.obj = $('<div class="notifyContainer"></div>').appendTo(mPlace);
			}

			$.notify.obj.children('div:hidden').remove();//remove old ones

			$.notify.obj = $('<div class="notify ui-state-highlight ui-corner-all">' + ($.notify.messages[mText] || mText) + '</div>')
				.appendTo($.notify.obj)
				.toggleClass('ui-state-error', (mText === 'error' || bError) ? true : false)
				.delay(4000).fadeOut();

			if (bPersistent) {
				//clear effects queue and hide after 10 seconds
				$.notify.obj.clearQueue().fadeOut(10000);//delay is not used because of jQuery bug - it will be called with 2500.
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