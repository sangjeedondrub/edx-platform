(function(define) {
    'use strict';
    define([
        'jquery',
        'gettext',
        'js/student_account/views/FormView'
    ],
        function($, gettext, FormView) {
            return FormView.extend({
                el: '#password-reset-form',

                tpl: '#password_reset-tpl',

                events: {
                    'click .js-reset': 'submitForm'
                },

                formType: 'password-reset',

                errorsTitle: gettext("An error occurred."),

                requiredStr: '',

                submitButton: '.js-reset',

                preRender: function() {
                    this.element.show($(this.el));
                    this.element.show($(this.el).parent());
                    this.listenTo(this.model, 'sync', this.saveSuccess);
                },

                toggleErrorMsg: function(show) {
                    if (show) {
                        this.setErrors();
                        this.toggleDisableButton(false);
                    } else {
                        this.$formFeedback.find(".submission-error").remove();
                        this.element.hide(this.$errors);
                    }
                },

                saveSuccess: function() {
                    this.trigger('password-email-sent');

                // Destroy the view (but not el) and unbind events
                    this.$el.empty().off();
                    this.stopListening();
                }
            });
        });
}).call(this, define || RequireJS.define);
