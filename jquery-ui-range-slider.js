
/*!
 *
 * Copyright Emilio Forrer
 * Released under the MIT license.
 */
 // modified by Andrew Hogan 10/2020
 // to make it a fill to 100% style, needed for grade ranges.
 // snap rightmost handler to right, leftmost to left. then each left and right to each other.
(function($) {
  return $.widget('uiExtension.rangeSlider', $.ui.slider, {
    _create: function() {
      var self = this;
      return self._super();
    },


    _refresh: function() {
      //this._super();
      return this._super();
    },

    _slide: function(event, index, newVal) {
      var allow, handlers, self, ui, width;


      allow = this._super(event, index, newVal);
      return allow;
    },
    _stop: function(event, index) {
      
      return this._super(event, index);
    }

  });
})($);
