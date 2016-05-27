'use strict';

/* global document */

var Hook = require('virtual-hook');

function RenderedHook(callback) {
  return Hook({
    hook: function hook(node) {
      if (!document.body.contains(node)) {
        return;
      }

      callback(node);
    }
  });
}

module.exports = RenderedHook;
