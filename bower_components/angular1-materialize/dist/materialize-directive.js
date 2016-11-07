'use strict';
angular.module('angular1-materialize', [])
.factory('Materialize', function() {
        return Materialize;
})
.directive('materialize', function() {
    return {
        scope: {
            functionName: '@materialize',
            params: '=materializeParams',
            selectOptions: '=materializeSelectOptions',
            init: '&materializeInit',
        },
        restrict: 'A',
        link: link,
    };
    function link(scope, element, attrs, ctl, transclude) {
        var previousValue = null ;
        var _waitFunction = {};
        var changeListenerShouldBeAdded = true;
        scope.$watchCollection('params', function() {
            performElementUpdates();
        });
        scope.$watchCollection('selectOptions', function() {
            performElementUpdates();
        });
        scope.$on('$destroy', function() {
            performElementRemotion();
        });
        scope.init({
            emit: function(action) {
                if (typeof action == "string") {
                    performLocalElementUpdates(action);
                } else {
                    performLocalElementUpdates(action.action, action.params);
                }
            }
        })
        function performElementRemotion() {
            if (isTooltip()) {
                var jQueryElement = $(element);
                var tooltipId = jQueryElement.attr('data-tooltip-id');
                if (tooltipId) {
                    $('#' + tooltipId).remove();
                }
            }
        }
        function performElementUpdates() {
            // it should have been created by now, but confirm anyway
            if (Materialize && Materialize.updateTextFields) {
                Materialize.updateTextFields();
            }
            // handle select changes from the HTML
            if (isSelect() && changeListenerShouldBeAdded) {
                var jQueryElement = $(element);
                jQueryElement.on("change", function(e){
                    if (!e.originalEvent || !e.originalEvent.internalToMaterialize) {
                        var event = document.createEvent("CustomEvent");
                        event.initCustomEvent("change", false, false, undefined);
                        event.internalToMaterialize = true;
                        element.dispatchEvent(event);
                    }
                }
                );
                changeListenerShouldBeAdded = false;
            }
            if (isAutocomplete()) {
                var jQueryElement = $(element);
                jQueryElement.on("change", function(e){element.dispatchEvent(new CustomEvent("input"))});
            }
            if (isDatePicker()) {
                var jQueryElement = $(element);
                var enablebtns = enableDPButtons;
                var params = scope.params || [];
                jQueryElement[scope.functionName].apply(jQueryElement, params);
                jQueryElement.on("change", function(e){element.dispatchEvent(new CustomEvent("input"))});
                var datePickerPopUp = jQueryElement.siblings(".picker").first();
                jQueryElement.on('click', function() {
                    datePickerPopUp.addClass('picker--focused picker--opened');
                    enablebtns();
                    //close on side click
                    $('.picker__holder').click(function(event) {
                        if (event.target.className === 'picker__holder') {
                            datePickerPopUp.removeClass('picker--focused picker--opened');
                        }
                    });
                    jQueryElement.change(function() {
                        setTimeout(function() {
                            enablebtns()
                        }, 10);
                    });
                    $('.picker__select--year').on('change', function() {
                        setTimeout(function() {
                            enablebtns();
                        }, 10);
                    });
                    $('.picker__select--month').on('change', function() {
                        setTimeout(function() {
                            enablebtns();
                        }, 10);
                    });
                });
            }
            performLocalElementUpdates();
        }
        function performLocalElementUpdates(functionName, params) {
            if (!functionName) {
				functionName=scope.functionName
			}
            if (!params) {
				params=scope.params
			}
			if (_waitFunction[functionName]) {
                return;
            }
            _waitFunction[functionName] = true;
            $(document).ready(function() {
                _waitFunction[functionName] = false;
                if (functionName) {
                    var jQueryElement = $(element);
                    if (jQueryElement[functionName]) {
                        if (params) {
                            if (params instanceof Array) {
                                jQueryElement[functionName].apply(jQueryElement, params);
                            } else {
                                throw new Error("Params has to be an array.");
                            }
                        } else {
                            jQueryElement[functionName]();
                        }
                    } else {
                        // fallback to running this function on the global Materialize object
                        if (Materialize[functionName]) {
                            if (params) {
                                if (params instanceof Array) {
                                    Materialize[functionName].apply(jQueryElement, params);
                                } else {
                                    throw new Error("Params has to be an array.");
                                }
                            } else {
                                Materialize[functionName]();
                            }
                        } else {
                            throw new Error("Couldn't find materialize function ''" + functionName + "' on element or the global Materialize object.");
                        }
                    }
                }
            });
        }
        function isTooltip() {
            return ( scope.functionName === "tooltip") ;
        }
        function isSelect() {
            return ( scope.functionName === "material_select") ;
        }
        function isDatePicker() {
            return ( scope.functionName === "pickadate") ;
        }
        function isAutocomplete() {
            return ( scope.functionName === "autocomplete") ;
        }
        function enableDPButtons() {
            $('.picker__clear').removeAttr("disabled");
            $('.picker__today').removeAttr("disabled");
            $('.picker__close').removeAttr("disabled");
            $('.picker__select--year').removeAttr("disabled");
            $('.picker__select--month').removeAttr("disabled");
        }
    }
});
/*        
        function ngDoCheck() {
            var jQueryElement = $(element);
            if (isSelect() && !jQueryElement.attr("multiple") && element.value != previousValue) {
                // handle select changes of the model
                previousValue = element.value;
                performLocalElementUpdates();
            }
            return false;
        }
        function ngOnChanges() {
            if (isSelect()) {
                setTimeout(function(){performLocalElementUpdates()}, 10);
            }
        }
*/
