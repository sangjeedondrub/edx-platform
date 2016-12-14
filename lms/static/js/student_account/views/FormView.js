(function(define) {
    'use strict';
    define([
        'jquery',
        'underscore',
        'backbone',
        'common/js/utils/edx.utils.validate',
        'edx-ui-toolkit/js/utils/html-utils'
    ],
        function($, _, Backbone, EdxUtilsValidate, HtmlUtils) {
            return Backbone.View.extend({
                tagName: 'form',

                el: '',

                tpl: '',

                fieldTpl: '#form_field-tpl',

                errorsTpl: '#form_errors-tpl',

                defaultErrorsTitle: gettext("An error occurred."),

                successTpl: '#form_success-tpl',

                statusTpl: '#form_status-tpl',

                events: {},

                errors: [],

                formType: '',

                $form: {},

                fields: [],

            // String to append to required label fields
                requiredStr: '*',

                submitButton: '',

                initialize: function(data) {
                    this.model = data.model;
                    this.preRender(data);

                    this.tpl = $(this.tpl).html();
                    this.fieldTpl = $(this.fieldTpl).html();
                    this.errorsTpl = $(this.errorsTpl).html();
                    this.successTpl = $(this.successTpl).html();
                    this.statusTpl = $(this.statusTpl).html();

                    this.buildForm(data.fields);
                    this.listenTo(this.model, 'error', this.saveError);
                },

            /* Allows extended views to add custom
             * init steps without needing to repeat
             * default init steps
             */
                preRender: function(data) {
                /* Custom code goes here */
                    return data;
                },

                render: function(html) {
                    var fields = html || '';

                    $(this.el).html(_.template(this.tpl)({
                        fields: fields
                    }));

                    this.postRender();

                    return this;
                },

                postRender: function() {
                    var $container = $(this.el);
                    this.$form = $container.find('form');
                    this.$formFeedback = $container.find('.js-form-feedback');
                    this.$submitButton = $container.find(this.submitButton);
                },

                buildForm: function(data) {
                    var html = [],
                        i,
                        len = data.length,
                        fieldTpl = this.fieldTpl;

                    this.fields = data;

                    for (i = 0; i < len; i++) {
                        if (data[i].errorMessages) {
                            data[i].errorMessages = this.escapeStrings(data[i].errorMessages);
                        }

                        html.push(_.template(fieldTpl)($.extend(data[i], {
                            form: this.formType,
                            requiredStr: this.requiredStr,
                            supplementalText: data[i].supplementalText || '',
                            supplementalLink: data[i].supplementalLink || ''
                        })));
                    }

                    this.render(html.join(''));
                },

            /* Helper method to toggle display
             * including accessibility considerations
             */
                element: {
                    hide: function($el) {
                        if ($el) {
                            $el.addClass('hidden');
                        }
                    },

                    scrollTop: function($el) {
                    // Scroll to top of selected element
                        $('html,body').animate({
                            scrollTop: $el.offset().top
                        }, 'slow');
                    },

                    show: function($el) {
                        if ($el) {
                            $el.removeClass('hidden');
                        }
                    }
                },

                escapeStrings: function(obj) {
                    _.each(obj, function(val, key) {
                        obj[key] = _.escape(val);
                    });

                    return obj;
                },

                forgotPassword: function(event) {
                    event.preventDefault();

                    this.trigger('password-help');
                },

                getFormData: function() {
                    var obj = {},
                        $form = this.$form,
                        elements = $form[0].elements,
                        i,
                        len = elements.length,
                        $el,
                        $label,
                        key = '',
                        errors = [],
                        test = {};

                    for (i = 0; i < len; i++) {
                        $el = $(elements[i]);
                        $label = $form.find('label[for=' + $el.attr('id') + ']');
                        key = $el.attr('name') || false;

                        if (key) {
                            test = this.validate(elements[i]);
                            if (test.isValid) {
                                obj[key] = $el.attr('type') === 'checkbox' ? $el.is(':checked') : $el.val();
                                $el.removeClass('error');
                                $label.removeClass('error');
                            } else {
                                errors.push(test.message);
                                $el.addClass('error');
                                $label.addClass('error');
                            }
                        }
                    }

                    this.errors = _.uniq(errors);

                    return obj;
                },

                saveError: function(error) {
                    this.errors = ['<li>' + error.responseText + '</li>'];
                    this.renderErrors(this.defaultErrorsTitle, this.errors)
                    this.toggleDisableButton(false);
                },

                renderErrors: function(title, errorMessages) {
                    this.renderFormFeedback(this.errorsTpl, {
                        context: {
                            title: title,
                            messagesHtml: HtmlUtils.HTML(errorMessages.join(""))
                        }
                    });
                },

                renderFormFeedback: function(template, context) {
                    this.clearFormFeedback();

                    HtmlUtils.append(this.$formFeedback, HtmlUtils.template(template)(context));

                // Scroll to feedback container
                    $('html,body').animate({
                        scrollTop: this.$formFeedback.offset().top
                    }, 'slow');

                // Focus on the feedback container to ensure screen readers see the messages.
                    this.$formFeedback.focus();
                },

            /* Allows extended views to add non-form attributes
             * to the data before saving it to model
             */
                setExtraData: function(data) {
                    return data;
                },

                submitForm: function(event) {
                    var data = this.getFormData();

                    if (!_.isUndefined(event)) {
                        event.preventDefault();
                    }

                    this.toggleDisableButton(true);
                    this.clearFormFeedback();

                    if (!_.compact(this.errors).length) {
                        data = this.setExtraData(data);
                        this.model.set(data);
                        this.model.save();
                    } else {
                        this.renderErrors(this.defaultErrorsTitle, this.errors);
                        this.toggleDisableButton(false);
                    }

                    this.postFormSubmission();
                },

            /* Allows extended views to add custom
             * code after form submission
             */
                postFormSubmission: function() {
                    return true;
                },

                clearFormFeedback: function() {
                    this.$formFeedback.html("");
                },

            /**
             * If a form button is defined for this form, this will disable the button on
             * submit, and re-enable the button if an error occurs.
             *
             * Args:
             *      disabled (boolean): If set to TRUE, disable the button.
             *
             */
                toggleDisableButton: function(disabled) {
                    if (this.$submitButton) {
                        this.$submitButton.attr('disabled', disabled);
                    }
                },

                validate: function($el) {
                    return EdxUtilsValidate.validate($el);
                }
            });
        });
}).call(this, define || RequireJS.define);
