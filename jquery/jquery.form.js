/*
 * form - jQuery form processing library.
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
  * @name  form
  * @type  jQuery
  * @param Hash		options					additional options
  * @param Function	options[fBeforeHandler]	Handler to run before submit
  * @param Function	options[fHandler]		Handler to process form after successfull submit (jQuery ajax event 'success')
  * @param Function	options[fAfterHandler]	Handler to run after submit
  *
  */

/*
 * TODO:
 * removeErrors - line #102 bug report #6390
 * not clear work with sAfterHandler
 * oXHRWindow will not work in prototype's way - rebuild
 * port confirmation/next form possibilities from xhrForm
 *
 */

(function($) {

	$.fn.form = function(aOptions) {
		//store settings
		this.data('form.aOptions', $.form.setOptions(aOptions));

		this.submit(function(e) {
			var aStoredSettings = $(this).data('form.aOptions');

			//run pre-submit handler
			if (aStoredSettings.fBeforeHandler) {
				aStoredSettings.fBeforeHandler($(this));
			}

			$.form.toggleButtons.call(this);

			$.post(this.action, this, $.proxy(aStoredSettings.fHandler, this));

			return false;
		});

	};

	$.form = {
		//set custom options (handlers)
		setOptions: function(aOptions) {
			//set default options
			if (!aOptions) {
				return { fHandler: $.form.ajaxSuccess };
			}

			var aStoredOptions = {};

			//trying to set custom handlers
			if ($.isFunction(aOptions.fBeforeHandler)) {
				aStoredOptions.fBeforeHandler = aOptions.fBeforeHandler;
			}
			if ($.isFunction(aOptions.fBeforeHandler)) {
				aStoredOptions.fAfterHandler = aOptions.fBeforeHandler;
			}
			if ($.isFunction(aOptions.fHandler)) {
				aStoredOptions.fHandler = aOptions.fHandler;
			}

			return aStoredOptions;
		},

		//show text errors messages
		showErrors: function(oResponse) {
			if (!$(this).children('div.ui-state-error').length) {
				$(this).prepend('<div class="ui-state-error ui-corner-all">' +
					'<div class="ui-icon ui-icon-alert" style="float: left;"></div>' +
					'<div style="margin-left: 20px;" class="errors"></div></div>');
			}

			$(this).find('div.errors').html(oResponse.sErrors).parent().show();

			//first add # to error id, than add class, than focus first one
			$($.map(oResponse.aErrorIDs, function(item) { return '#' + item;}).join()).addClass('ui-state-error').eq(0).focus();
		},

		//remove errors from previous call
		removeErrors: function() {
			if($(this).children('div.ui-state-error').length) {
				$(this).children('div.ui-state-error').hide().children('div.errors').empty();
			}

			$(this).find(':input').removeClass('ui-state-error');
	//		Or like this without error
	//		$($(this.iID)[0].elements).removeClass('validation_error');
		},

		//toggle possible submit buttons for this form
		toggleButtons: function() {
			$(this).find('input[type=submit], input[type=button]').each(function() {
				this.disabled = !this.disabled;
			});
			//or like this
//			$('input[type=submit], input[type=button]').attr('disabled', function() {return !this.disabled;});
		},

		//on successfull post
		ajaxSuccess: function(mData, sTestStatus, oJSReq) {
			$.form.removeErrors.call(this);

			$.form.toggleButtons.call(this);

			if (oJSReq.responseJS == null) {
				//we have global error
				alert('Произошла ошибка, попробуйте ещё раз позднее.');
			}
			else if (oJSReq.responseJS.aErrorIDs != null) {
//				if (oJSReq.responseJS.aErrorIDs.length == 1 && oJSReq.responseJS.aErrorIDs[0] == 'confirm_form') {
//					//we must show confirm dialog before send
//					this.confirmation();
//				}
//				else {
					//show errors
					$.form.showErrors.call(this, oJSReq.responseJS);
//				}
			}
			else {
				//all good

				//if we have custom run handler
				if ($(this).data('form.aOptions').fAfterHandler) {
					$(this).data('form.aOptions').fAfterHandler(oJSReq);
				}

				if (oJSReq.responseJS.reload) {
					alert('Операция выполнена успешно!');
					window.location.reload();
				}
				else if (oJSReq.responseJS.ok) {
					if (oJSReq.responseJS.ok == 1) {
						alert('Операция выполнена успешно!');
					}
					else {
						alert(oJSReq.responseJS.ok);
					}
				}
				else if (oJSReq.responseJS.location) {
					alert('Операция выполнена успешно!');
					//if location is the same page.
					if (window.location.pathname + window.location.search == oJSReq.responseJS.location) {
						oJSReq.responseJS.location += '?' + (new Date()).getTime();
					}
					window.location = oJSReq.responseJS.location;
				}
				else if (oJSReq.responseJS.new_window) {
					oXHRWindow = window.open('','main_xhr_new_window');
					//appending child div only once!
					if (!oXHRWindow.document.body.firstChild) {
						oXHRWindow.document.body.appendChild(document.createElement('div'));
					}

					oXHRWindow.document.body.firstChild.update(oJSReq.responseJS.sPageContents);
				}
			}
		}
	};

})(jQuery);