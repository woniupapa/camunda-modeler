'use strict';

var inherits = require('inherits');

var h = require('vdom/h');

var BaseComponent = require('base/component');

var ensureOpts = require('util/ensure-opts'),
    scrollTabs = require('util/dom/scroll-tabs');

var find = require('lodash/collection/find');

var CloseHandle = require('base/components/misc/close-handle');


var TABS_OPTS = {
  selectors: {
    tabsContainer: '.tabs-container',
    tab: '.tab',
    active: '.active',
    ignore: '.empty'
  }
};


function Tabbed(options) {

  ensureOpts([ 'onClose', 'onSelect', 'onContextMenu' ], options);

  BaseComponent.call(this, options);

  this.render = function() {

    var onClose = options.onClose,
        onSelect = options.onSelect,
        onContextMenu = options.onContextMenu,
        isFocused = options.isFocused,
        tabs = options.tabs,
        pane = options.pane,
        styles = options.styles,
        activeTab = options.active;

    var onScroll = (node) => {
      var tab = find(options.tabs, { id: node.tabId });

      if (tab) {
        onSelect(tab);
      }
    };


    var html =
      <div className={ 'tabbed ' + (options.className || '') } style={ styles }>
        <div className="tabs"
             scroll={ scrollTabs(TABS_OPTS, onScroll) } >
          <div className="scroll-tabs-button scroll-tabs-left">‹</div>
          <div className="scroll-tabs-button scroll-tabs-right">›</div>
          <div className="tabs-container" belongsToPane={ pane } >
            {
              tabs.map(tab => {

                if (!tab.id) {
                  throw new Error('no id specified');
                }

                var action = tab.action || onSelect.bind(null, tab),
                    activeClassname = '';

                if (tab === activeTab) {
                  activeClassname = isFocused ? 'active' : 'focused';
                }

                var className = [ activeClassname, 'tab', tab.empty ? 'empty' : '' ].join(' ');

                return (
                  <div className={ className }
                       key={ tab.id }
                       ref={ tab.id }
                       tabId={ tab.id }
                       title={ tab.title }
                       onMousedown={ action }
                       onContextmenu={ onContextMenu.bind(null, tab) }
                       tabIndex="0">
                    { tab.label }
                    { tab.closable
                        ? <CloseHandle dirty={ tab.dirty }
                                       onClick={ onClose.bind(null, tab) } />
                        : null }
                  </div>
                );
              })
            }
          </div>
        </div>
        <div className="content">
          { activeTab ? h(activeTab) : null }
        </div>
      </div>;

    return html;
  };
}

inherits(Tabbed, BaseComponent);

module.exports = Tabbed;
