/*!
 * # Range slider for Semantic UI.
 *
 */

;(function ( $, window, document, undefined ) {

    "use strict";

    $.fn.range = function(parameters) {

        var
            $allModules    = $(this),

            offsetPerc = 2.9,

            query          = arguments[0],
            methodInvoked  = (typeof query === 'string'),
            queryArguments = [].slice.call(arguments, 1)
        ;

        $allModules
            .each(function() {

                var
                    settings          = ( $.isPlainObject(parameters) )
                        ? $.extend(true, {}, $.fn.range.settings, parameters)
                        : $.extend({}, $.fn.range.settings),

                    namespace       = settings.namespace,
                    min             = settings.min,
                    max             = settings.max,
                    step            = settings.step,
                    start           = settings.start,
                    input           = settings.input,

                    eventNamespace  = '.' + namespace,
                    moduleNamespace = 'module-' + namespace,

                    $module         = $(this),

                    element         = this,
                    instance        = $module.data(moduleNamespace),

                    inner,
                    thumb,
                    trackLeft,
                    precision,
                    vertical,

                    module
                ;

                module = {

                    initialize: function() {
                        module.instantiate();
                        module.sanitize();
                    },

                    instantiate: function() {
                        instance = module;
                        $module
                            .data(moduleNamespace, module)
                        ;
                        // determine if slider is vertical
                        vertical = !!($module.hasClass('vertical'));
                        $(element).html("<div class='inner'><div class='track'></div><div class='track-fill'></div><div class='thumb'></div></div>");
                        if (vertical) {
                            var $inner = $('.ui.range .inner');
                            // there's no jQuery 2.3.x so indexOf '3.' will work without false positive
                            if (jQuery.fn.jquery.indexOf('3.') === -1) {
                                // as jQuery < 3 doesn't handle proper size after css rotation
                                // manually update height to match new width
                                // there's a drawback: the slider is also triggered when clicked on its side
                                $inner.css('height', $inner.width() + 'px');
                            }
                            $(element).css('transform', 'rotate(-90deg)');
                        }
                        inner = $(element).children('.inner')[0];
                        thumb = $(element).find('.thumb')[0];
                        trackLeft = $(element).find('.track-fill')[0];
                        // find precision of step, used in calculating the value
                        module.determinePrecision();
                        // set start location
                        module.setValuePosition(settings.start);
                        // event listeners
                        $(element).find('.track, .thumb, .inner').on('mousedown', function(event) {
                            event.stopImmediatePropagation();
                            event.preventDefault();
                            $(this).closest(".range").trigger('mousedown', event);
                        });
                        $(element).find('.track, .thumb, .inner').on('touchstart', function(event) {
                            event.stopImmediatePropagation();
                            event.preventDefault();
                            $(this).closest(".range").trigger('touchstart', event);
                        });
                        $(element).on('mousedown', function(event, originalEvent) {
                            module.rangeMousedown(event, false, originalEvent);
                        });
                        $(element).on('touchstart', function(event, originalEvent) {
                            module.rangeMousedown(event, true, originalEvent);
                        });
                    },

                    sanitize: function() {
                        if (typeof settings.min !== 'number') {
                            settings.min = parseInt(settings.min) || 0;
                        }
                        if (typeof settings.max !== 'number') {
                            settings.max = parseInt(settings.max) || false;
                        }
                        if (typeof settings.start !== 'number') {
                            settings.start = parseInt(settings.start) || 0;
                        }
                    },

                    determinePrecision: function() {
                        var split = String(settings.step).split('.');
                        var decimalPlaces;
                        if(split.length === 2) {
                            decimalPlaces = split[1].length;
                        } else {
                            decimalPlaces = 0;
                        }
                        precision = Math.pow(10, decimalPlaces);
                    },

                    determineValue: function(startPos, endPos, currentPos) {
                        var ratio = (currentPos - startPos) / (endPos - startPos);
                        // reversed when vertical
                        if (vertical) ratio = 1 - ratio;
                        return ratio;
                    },

                    determinePosition: function(value) {
                        var ratio = (value - settings.min) / (settings.max - settings.min);
                        return ratio * 100;
                    },

                    setValue: function(newValue, triggeredByUser = true) {
                        if(settings.input) {
                            $(settings.input).val(newValue);
                        }
                        if(settings.onChange) {
                            settings.onChange(newValue, {triggeredByUser: triggeredByUser});
                        }
                    },

                    setPosition: function(value) {
                        $(thumb).css({left: String(value - offsetPerc) + '%'});
                        $(trackLeft).css({width: '100%'});
                    },

                    // compute values depending on the orientation of the slider (vertical/horizontal)
                    rangeMousedown: function(mdEvent, isTouch, originalEvent) {
                        if( !$(element).hasClass('disabled') ) {
                            mdEvent.preventDefault();
                            if (vertical) {
                                var top = $(inner).offset().top;
                                var height = top + $(inner).height();
                                var pageY;
                                if (isTouch) {
                                    pageY = originalEvent.originalEvent.touches[0].pageY;
                                }
                                else {
                                    pageY = (typeof mdEvent.pageY !== 'undefined') ? mdEvent.pageY : originalEvent.pageY;
                                }
                            }
                            else {
                                var left = $(inner).offset().left;
                                var right = left + $(inner).width();
                                var pageX;
                                if (isTouch) {
                                    pageX = originalEvent.originalEvent.touches[0].pageX;
                                }
                                else {
                                    pageX = (typeof mdEvent.pageX !== 'undefined') ? mdEvent.pageX : originalEvent.pageX;
                                }
                            }

                            var value;
                            if (vertical) value = module.determineValue(top, height, pageY);
                            else value = module.determineValue(left, right, pageX);
                            if ((!vertical && (pageX >= left && pageX <= right)) || (vertical && (pageY >= top && pageY <= height))) {

                                var percent = value * 100;
                                if (vertical) module.setPosition(percent);
                                else module.setPosition(percent);
                                module.setValue(value);
                            }
                            // set new position & value
                            var rangeMousemove = function(mmEvent) {
                                mmEvent.preventDefault();
                                if (isTouch) {
                                    if (vertical) pageY = mmEvent.originalEvent.touches[0].pageY;
                                    else pageX = mmEvent.originalEvent.touches[0].pageX;
                                }
                                else {
                                    if (vertical) pageY = mmEvent.pageY;
                                    else pageX = mmEvent.pageX;
                                }

                                if (vertical) value = module.determineValue(top, height, pageY);
                                else value = module.determineValue(left, right, pageX);

                                if ((!vertical && (pageX >= left && pageX <= right)) || (vertical && (pageY >= top && pageY <= height))) {
                                    if (value >= settings.min && value <= settings.max) {

                                        var percent = value * 100;
                                        if (vertical) module.setPosition(percent);
                                        else module.setPosition(percent);
                                        module.setValue(value);
                                    }
                                }
                            }
                            // stop event listener
                            var rangeMouseup = function(muEvent) {
                                if(isTouch) {
                                    $(document).off('touchmove', rangeMousemove);
                                    $(document).off('touchend', rangeMouseup);
                                }
                                else {
                                    $(document).off('mousemove', rangeMousemove);
                                    $(document).off('mouseup', rangeMouseup);
                                }
                            }
                            if(isTouch) {
                                $(document).on('touchmove', rangeMousemove);
                                $(document).on('touchend', rangeMouseup);
                            }
                            else {
                                $(document).on('mousemove', rangeMousemove);
                                $(document).on('mouseup', rangeMouseup);
                            }
                        }
                    },

                    setValuePosition: function(val, triggeredByUser = true) {
                        var position = module.determinePosition(val);
                        module.setPosition(position);
                        module.setValue(val, triggeredByUser);
                    },

                    invoke: function(query) {
                        switch(query) {
                            case 'set value':
                                if(queryArguments.length > 0) {
                                    instance.setValuePosition(queryArguments[0], false);
                                }
                                break;
                        }
                    },

                };

                if(methodInvoked) {
                    if(instance === undefined) {
                        module.initialize();
                    }
                    module.invoke(query);
                }
                else {
                    module.initialize();
                }

            });

        return this;

    };

    $.fn.range.settings = {
        name         : 'Range',
        namespace    : 'range',

        min          : 0,
        max          : false,
        step         : 1,
        start        : 0,
        input        : false,

        onChange     : function(value){}
    };

})( jQuery, window, document );
