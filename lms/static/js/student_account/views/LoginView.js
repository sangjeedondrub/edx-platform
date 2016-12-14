(function(define) {
    'use strict';
    define([
        'jquery',
        'underscore',
        'gettext',
        'edx-ui-toolkit/js/utils/html-utils',
        'js/student_account/views/FormView'
    ],
        function($, _, gettext, HtmlUtils, FormView) {
            return FormView.extend({
                el: '#login-form',
                tpl: '#login-tpl',
                events: {
                    'click .js-login': 'submitForm',
                    'click .forgot-password': 'forgotPassword',
                    'click .login-provider': 'thirdPartyAuth'
                },
                formType: 'login',
                requiredStr: '',
                submitButton: '.js-login',
                errorsTitle: gettext("We couldn't sign you in."),

                preRender: function(data) {
                    this.providers = data.thirdPartyAuth.providers || [];
                    this.hasSecondaryProviders = (
                    data.thirdPartyAuth.secondaryProviders && data.thirdPartyAuth.secondaryProviders.length
                );
                    this.currentProvider = data.thirdPartyAuth.currentProvider || '';
                    this.errorMessage = data.thirdPartyAuth.errorMessage || '';
                    this.platformName = data.platformName;
                    this.resetModel = data.resetModel;
                    this.supportURL = data.supportURL;

                    this.listenTo(this.model, 'sync', this.saveSuccess);
                    this.listenTo(this.resetModel, 'sync', this.resetEmail);
                },

                render: function(html) {
                    var fields = html || '';

                    $(this.el).html(_.template(this.tpl)({
                    // We pass the context object to the template so that
                    // we can perform variable interpolation using sprintf
                        context: {
                            fields: fields,
                            currentProvider: this.currentProvider,
                            errorMessage: this.errorMessage,
                            providers: this.providers,
                            hasSecondaryProviders: this.hasSecondaryProviders,
                            platformName: this.platformName
                        }
                    }));

                    this.postRender();

                    return this;
                },

                postRender: function() {
                    this.$container = $(this.el);
                    this.$form = this.$container.find('form');
                    this.$formFeedback = this.$container.find('.js-form-feedback');
                    this.$authError = this.$container.find('.already-authenticated-msg');
                    this.$submitButton = this.$container.find(this.submitButton);

                /* If we're already authenticated with a third-party
                 * provider, try logging in.  The easiest way to do this
                 * is to simply submit the form.
                 */
                    if (this.currentProvider) {
                        this.model.save();
                    }
                },

                forgotPassword: function(event) {
                    event.preventDefault();

                    this.trigger('password-help');
                    this.clearFormFeedback();
                },

                resetEmail: function() {
                    var email = $('#password-reset-email').val(),
                        successTitle = gettext("Check Your Email"),
                        successMessageHtml = HtmlUtils.interpolateHtml(
                            gettext('{paragraphStart}You entered {boldStart}{email}{boldEnd}. If this email address is associated with your {platform_name} account, we will send a message with password reset instructions to this email address.{paragraphEnd}' + // eslint-disable-line max-len
                            '{paragraphStart}If you do not receive a password reset message, verify that you entered the correct email address, or check your spam folder.{paragraphEnd}' + // eslint-disable-line max-len
                            '{paragraphStart}If you need further assistance, {anchorStart}contact technical support{anchorEnd}.{paragraphEnd}'), { // eslint-disable-line max-len
                                boldStart: HtmlUtils.HTML('<b>'),
                                boldEnd: HtmlUtils.HTML('</b>'),
                                paragraphStart: HtmlUtils.HTML('<p>'),
                                paragraphEnd: HtmlUtils.HTML('</p>'),
                                email: email,
                                platform_name: this.platformName,
                                anchorStart: HtmlUtils.HTML('<a href="' + this.supportURL + '">'),
                                anchorEnd: HtmlUtils.HTML('</a>')
                            }
                        );

                    this.clearFormFeedback();
                    HtmlUtils.append(this.$formFeedback, HtmlUtils.template(this.successTpl)({
                        context: {
                            title: successTitle,
                            messageHtml: successMessageHtml
                        }
                    }));
                },

                thirdPartyAuth: function(event) {
                    var providerUrl = $(event.currentTarget).data('provider-url') || '';

                    if (providerUrl) {
                        window.location.href = providerUrl;
                    }
                },

                saveSuccess: function() {
                    this.trigger('auth-complete');
                    this.clearFormFeedback();
                },

                saveError: function(error) {
                    var msg = error.responseText;
                    if (error.status === 0) {
                        msg = gettext('An error has occurred. Check your Internet connection and try again.');
                    } else if (error.status === 500) {
                        msg = gettext('An error has occurred. Try refreshing the page, or check your Internet connection.');
                    }
                    this.errors = ['<li>' + msg + '</li>'];

                /* If we've gotten a 403 error, it means that we've successfully
                 * authenticated with a third-party provider, but we haven't
                 * linked the account to an EdX account.  In this case,
                 * we need to prompt the user to enter a little more information
                 * to complete the registration process.
                 */
                    if (error.status === 403 &&
                     error.responseText === 'third-party-auth' &&
                     this.currentProvider) {
                        this.element.show(this.$authError);
                    } else {
                        this.element.hide(this.$authError);
                        this.setErrors();
                    }
                    this.toggleDisableButton(false);
                }
            });
        });
}).call(this, define || RequireJS.define);
