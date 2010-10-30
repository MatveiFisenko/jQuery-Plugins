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

	$.fn.form = function(options) {
		//merge options with default ones, if options are unset - make empty object
		options = $.extend({}, $.form.defaultOptions, options || {});

		//store settings
		this.data('form.aOptions', options);

		this.submit(function(e) {
			//run pre-submit handler
			if (options.fBeforeHandler) {
				//if fBeforeHandler returns false - do not submit form
				if (options.fBeforeHandler(this) === false) return false;
			}

			$.form.toggleButtons.call(this);

			$.ajax({
				type: 'POST',
				url: this.action,
				data: $(this).serialize(),
				success: $.proxy(options.fHandler, this),
				error: $.proxy(options.fErrorHandler, this)
			});
			return false;
		});

		return this;
	};

	$.form = {
		//show text errors messages
		showErrors: function(oResponse) {
			if (!$(this).children(':first').is('div.ui-state-error')) {
				$(this).prepend('<div class="ui-state-error ui-corner-all">' +
					'<div class="ui-icon ui-icon-alert" style="float: left;"></div>' +
					'<div style="margin-left: 20px;" class="errors"></div></div>');
			}

			$(this).find('div.errors').html(oResponse.sErrors).parent().show();
			$('html,body').animate({ scrollTop: $(this).find('div.errors').offset().top });//move page to errors div

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
			$(this).find('input[type=submit], button').each(function() {
				this.disabled = !this.disabled;
			});
			//or like this
//			$('input[type=submit], input[type=button]').attr('disabled', function() {return !this.disabled;});
		},

		//on successfull post
		ajaxSuccess: function(mData, sTestStatus) {
			$.form.removeErrors.call(this);

			$.form.toggleButtons.call(this);

			if (mData == null) {
				//we have global error
				$.notify.show('error', false, this);
			}
			else if (mData.aErrorIDs != null) {
//				if (mData.aErrorIDs.length == 1 && mData.aErrorIDs[0] == 'confirm_form') {
//					//we must show confirm dialog before send
//					this.confirmation();
//				}
//				else {
					//show errors
					$.form.showErrors.call(this, mData);
//				}
			}
			else {
				//all good

				//if we have custom run handler
				if ($(this).data('form.aOptions').fAfterHandler) {
					if ($(this).data('form.aOptions').fAfterHandler(mData, this) === false) return false;
				}

				if (mData.reload) {
					$.notify.show('success', false, this);
					window.location.reload();
				}
				else if (mData.ok) {
					if (mData.ok == 1) {
						$.notify.show('success', false, this);
					}
					else {
						$.notify.show(mData.ok, false, this);
					}
				}
				else if (mData.location) {
					$.notify.show('success', false, this);
					//if location is the same page.
					if (window.location.pathname + window.location.search == mData.location) {
						mData.location += '?' + (new Date()).getTime();
					}
					window.location = mData.location;
				}
				else if (mData.new_window) {
					oXHRWindow = window.open('','main_xhr_new_window');
					//appending child div only once!
					if (!oXHRWindow.document.body.firstChild) {
						oXHRWindow.document.body.appendChild(document.createElement('div'));
					}

					oXHRWindow.document.body.firstChild.update(mData.sPageContents);
				}
				//if we have new row for a table
				else if (mData.aNewRow) {
					//send event only if table is specified, see jquery.editable.js
					if ($.editable.sTableID) {
						$('#' + $.editable.sTableID).trigger('eNewRow', [mData.aNewRow]);
					}
				}
				//if we have edited row for a table
				else if (mData.aEditRow) {
					//send event only if table is specified, see jquery.editable.js
					if ($.editable.sParentTableID) {
						$('#' + $.editable.sParentTableID).trigger('eNewRow', [mData.aEditRow, true]);
						$.notify.show('updated', false, this);
					}
				}
				//if we have delete row for a table
				else if (mData.aDeleteRow) {
					//successful delete
					if (mData.aDeleteRow !== 'error') {
						alert('Объект успешно удалён.');
						window.location.reload();
					}
					//possible trigger error
					else {
						alert('Объект не может быть удалён, потому что имеет ссылки на другие объекты (люди/группы/платежи/визиты).');
					}
				}
			}
		},

		//on error
		ajaxError: function() {
			$.form.toggleButtons.call(this);

			$.notify.show('error', false, this);
		}
	};

	$.form.defaultOptions = { fHandler: $.form.ajaxSuccess, fErrorHandler: $.form.ajaxError };

})(jQuery);