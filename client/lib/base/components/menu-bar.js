'use strict';

var h = require('vdom/h');

var domQuery = require('min-dom/lib/query');

var raf = require('raf');

function MenuBar(options) {
  if (!(this instanceof MenuBar)) {
    return new MenuBar(options);
  }


  this.render = function() {

    var entries = options.entries,
        immersiveMode = options.immersiveMode;


    function centerMenu() {
      var node = domQuery('.menu-bar');

      var clientWidth = node.clientWidth,
          parent = node.parentNode,
          parentWidth = parent.clientWidth;

      node.style.left = (parentWidth * 0.5) - (clientWidth / 2) + 'px';
    }

    if (immersiveMode) {
      raf(centerMenu);
    }

    var html = (
    <div className="menu-bar">
      {
        entries.map(e => {
          return <div className="entry" key={ e.id }>{ h(e) }</div>;
        })
      }
    </div>);

    return html;
  };
}

module.exports = MenuBar;
