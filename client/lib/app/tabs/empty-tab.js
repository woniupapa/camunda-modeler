'use strict';

var inherits = require('inherits');

var assign = require('lodash/object/assign');

var Tab = require('base/components/tab');

var ensureOpts = require('util/ensure-opts');


function EmptyTab(options) {
  var createOptions;

  if (!(this instanceof EmptyTab)) {
    return new EmptyTab(options);
  }

  options = assign({ empty: true }, options);

  createOptions = {
    pane: options.pane
  };

  ensureOpts([
    'app',
    'events'
  ], options);

  var openContextMenu = (evt) => {
    evt.preventDefault();

    this.app.emit('context-menu:open', 'empty-tab');
  };

  var updateState = () => {
    this.events.emit('tools:state-changed', this, {});
  };

  this.render = function() {

    var html =
      <div className="empty-tab"
           onClick={ updateState }
           onContextmenu={ openContextMenu }>
        <p className="buttons-create">
          <span>Create a </span>
          <button onClick={ this.app.compose('triggerAction', 'create-bpmn-diagram', createOptions) }>
            BPMN diagram
          </button>
          <span> or </span>
          <button onClick={ this.app.compose('triggerAction', 'create-dmn-diagram', createOptions) }>
            DMN diagram
          </button>
          <span> or </span>
          <button onClick={ this.app.compose('triggerAction', 'create-cmmn-diagram', createOptions) }>
            CMMN diagram
          </button>
        </p>
      </div>;

    return html;
  };

  Tab.call(this, options);

  this.on('focus', () => updateState);
}

inherits(EmptyTab, Tab);

module.exports = EmptyTab;
