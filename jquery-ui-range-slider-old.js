
/*!
 *
 * Copyright Emilio Forrer
 * Released under the MIT license.
 */
 // modified by Andrew Hogan 10/2020
 // to make it a fill to 100% style, needed for grade ranges.
 // snap rightmost handler to right, leftmost to left. then each left and right to each other.
 // |--E--|--D--|--D--|--D+-|--C--|--C--|--C+-|--B--|--B--|--B+-|--E--|--A--|--A+-|
 // |     |--D--|     |--D+-|     |--C--|     |--B--|     |--B+-|     |--A--|     |
(function($) {
  return $.widget('uiExtension.rangeSlider', $.ui.slider, {
    _pinHolders: function(){
      var self = this;

    },
    _create: function() {
      var self;
      self = this;
      self.options.values = [];
      self.options.rangeValues = [];
      if (self.options.overlap == null) {
        self.options.overlap = true;
      }
      if (self.options.rangeBarColor == null) {
        self.options.rangeBarColor = '#F5F5F5';
      }
      // first, append the range color and label for E,
      $(self.element).append('<div class="ui-slider-range ui-widget-header range-bg-' + "first" + '" style="left: ' + (100 * 0 / self.options.max).toString() + '%; width: ' + 100 * (self.options.ranges[0].startValue - 0) / self.options.max + '%; background: none repeat scroll 0% 0% ' + self.options.color1 + ';" ><div class="range-label"></div></div>');
      $(self.options.ranges).each(function(k, v) {
        v = self._parseRangeValues(v);
        if (v.startValue === v.endValue) {
          v.endValue = v.startValue + 1;
        }
        self.options.values.push(v.startValue);
        self.options.values.push(v.endValue);
        self.options.rangeValues.push(v);
        self.options.rangeValues.push(v);
        $(self.element).append('<div class="ui-slider-range ui-widget-header range-bg-' + v.id.toString() + '" style="left: ' + (100 * v.startValue / self.options.max).toString() + '%; width: ' + 100 * (v.endValue - v.startValue) / self.options.max + '%; background: none repeat scroll 0% 0% ' + v.color + ';" ><div class="range-label"></div></div>');
        var w = 0;
        if (k == self.options.ranges.length-1) {
          w = (self.options.max - v.endValue);
        }
        else {
          w = (self.options.ranges[k+1].startValue - v.endValue);
        }
        $(self.element).append('<div class="ui-slider-range ui-widget-header range-bg-' + v.id.toString() + '-2" style="left: ' + (100 * v.endValue / self.options.max).toString() + '%; width: ' + 100 * w / self.options.max + '%; background: none repeat scroll 0% 0% ' + v.color + ';" ><div class="range-label"></div></div>');
      });

      return self._super();
    },
    _parseRangeValues: function(obj) {
      var parsed;
      parsed = $.extend(true, {
        id: (new Date).getTime(),
        startValue: 0,
        endValue: 1,
        color: this.options.rangeBarColor,
        name:""
      }, obj);
      return parsed;
    },
    _createHandles: function() {
      var self;
      self = this;
      self._super();
      return this.handles.each(function(index, handler) {
        var range;
        handler = $(handler);
        range = self.options.rangeValues[index];
        handler.addClass('range-handler-' + range.id);
        handler.data('id', range.id);
        handler.data('period', range);
        if (self.options.values[index] === range.startValue) {
          handler.addClass('left');
          handler.data('value', range.startValue);
        }
        if (self.options.values[index] === range.endValue) {
          handler.addClass('right');
          return handler.data('value', range.endValue);
        }
      });
    },
    _checkLimit: function(index, changeValue) {
      var closestLimit, handlers, leftLimit, result, rightLimit, self;
      if (changeValue == null) {
        changeValue = false;
      }
      self = this;
      result = true;
      handlers = self._getHandlers(index);
      rightLimit = handlers.rightHandler.position().left - handlers.rightHandler.outerWidth();
      closestLimit = 0;
      leftLimit = handlers.leftHandler.position().left + handlers.leftHandler.outerWidth();
      if (handlers.currentHandler.position().left > rightLimit && handlers.currentHandler.hasClass('left')) {
        if (changeValue === true) {
          handlers.currentHandler.css('left', rightLimit);
        }
        return false;
      }
      if (handlers.currentHandler.position().left < leftLimit && handlers.currentHandler.hasClass('right')) {
        if (changeValue === true) {
          handlers.currentHandler.css('left', leftLimit);
        }
        return false;
      }
      if ((self.options.overlap == null) || self.options.overlap === false) {
        if (handlers.currentHandler.hasClass('right') && (handlers.closestHandler != null) && handlers.closestHandler.length > 0) {
          closestLimit = handlers.closestHandler.position().left - handlers.closestHandler.outerWidth();
          if (handlers.currentHandler.position().left > closestLimit) {
            if (changeValue === true) {
              handlers.currentHandler.css('left', closestLimit);
            }
            return false;
          }
        }
        if (handlers.currentHandler.hasClass('left') && (handlers.closestHandler != null) && handlers.closestHandler.length > 0) {
          closestLimit = handlers.closestHandler.position().left + handlers.closestHandler.outerWidth();
          if (handlers.currentHandler.position().left < closestLimit) {
            if (changeValue === true) {
              handlers.currentHandler.css('left', closestLimit);
            }
            return false;
          }
        }
      }
    },
    _refreshInfoBars: function() {
      var self;
      self = this;
      return $(self.handles).each(function(k, v) {
        return self._renderInfoBar({}, k);
      });
    },
    _refresh: function() {
      this._super();
      return this._refreshInfoBars();
    },
    _rageUiHash: function(event, index) {
      var range, uiHash;
      uiHash = {};
      uiHash.handlers = this._getHandlers(index);
      uiHash.ranges = this.options.ranges;
      range = $.grep(this.options.ranges, function(value) {
        return value.id.toString() === uiHash.handlers.currentHandler.data('id').toString();
      });
      if (range != null) {
        range = range[0];
        range.startValue = uiHash.handlers.leftHandler.data('value');
        range.endValue = uiHash.handlers.rightHandler.data('value');
        uiHash.range = range;
      }
      return uiHash;
    },
    _slide: function(event, index, newVal) {
      var allow, handlers, self, ui, width;
      self = this;
      allow = true;
      handlers = self._getHandlers(index);
      handlers.currentHandler.data('value', self.options.values[index]);
      width = handlers.rightHandler.position().left - handlers.leftHandler.position().left;
      handlers.rangeBar.css('left', handlers.leftHandler.css('left'));
      handlers.rangeBar.css('width', width.toString() + 'px');
      ui = self._rageUiHash(event, index);
      if (self._checkLimit(index) === false) {
        allow = false;
      }
      if (allow === false) {
        return false;
      } else {
        allow = self._trigger('rangeSlide', event, ui);
      }
      self._renderInfoBar(event, index);
      allow = this._super(event, index, newVal);
      return allow;
    },
    _stop: function(event, index) {
      console.log("Slider stop:",this);
      this._checkLimit(index, true);
      return this._super(event, index);
    },
    _renderInfoBar: function(event, index) {
      var self, text, ui;
      self = this;
      text = "";
      ui = self._rageUiHash(event, index);
      ui.label = $('.range-label', ui.handlers.rangeBar);
      if ($.isFunction(self.options.rangeLabel)) {
        return self._trigger('rangeLabel', event, ui);
      } else {
        text = "<span class='range-label-name'>" + self.options.rangeValues[index].name + "</span> (" + ui.handlers.leftHandler.data('value').toString() + ' to ' + ui.handlers.rightHandler.data('value').toString() + ")";
        return ui.label.empty().append(text);
      }
    },
    _getHandlers: function(index) {
      var handlerSelector, handlers, self;
      handlers = {};
      self = this;
      handlers.currentHandler = $(self.handles[index]);
      handlerSelector = '.range-handler-' + handlers.currentHandler.data('id');
      handlers.leftHandler = $(handlerSelector + '.left:first', self.element);
      handlers.rightHandler = $(handlerSelector + '.right:first', self.element);
      handlers.rangeBar = $('.range-bg-' + handlers.currentHandler.data('id'), self.element);
      if (handlers.currentHandler.hasClass('right')) {
        handlers.closestHandler = handlers.currentHandler.next('.left:first');
      }
      if (handlers.currentHandler.hasClass('left')) {
        handlers.closestHandler = handlers.currentHandler.prev('.right:first');
      }
      return handlers;
    }
  });
})($);
