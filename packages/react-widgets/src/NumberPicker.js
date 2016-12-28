import React from 'react';
import cn from 'classnames';
import uncontrollable from 'uncontrollable';

import Widget from './Widget';
import WidgetPicker from './WidgetPicker';
import Select from './Select';
import Input from './NumberInput';
import Button from './Button';
import * as Props from './util/Props';
import focusManager from './util/focusManager';
import { widgetEditable } from './util/interaction';
import { notify } from './util/widgetHelpers';
import compat from './util/compat';
import * as CustomPropTypes from './util/PropTypes';
import { directions } from './util/constants';
import withRightToLeft from './util/withRightToLeft';
import { number as numberLocalizer } from './util/localizers';

var format = props => numberLocalizer.getFormat('default', props.format)

// my tests in ie11/chrome/FF indicate that keyDown repeats
// at about 35ms+/- 5ms after an initial 500ms delay. callback fires on the leading edge
function createInterval(callback) {
  let fn
  var id, cancel = () => clearTimeout(id);

  id = setTimeout(fn = () => {
    id = setTimeout(fn, 35)
    callback() //fire after everything in case the user cancels on the first call
  }, 500)

  return cancel
}


function clamp(value, min, max) {
  max = max == null ? Infinity : max
  min = min == null ? -Infinity : min;

  if (value == null || value === '')
    return null

  return Math.max(Math.min(value, max), min)
}

@withRightToLeft
class NumberPicker extends React.Component {

  static propTypes = {

    // -- controlled props -----------
    value: React.PropTypes.number,
    onChange: React.PropTypes.func,
    //------------------------------------

    min: React.PropTypes.number,
    max: React.PropTypes.number,
    step: React.PropTypes.number,
    precision: React.PropTypes.number,

    culture: React.PropTypes.string,
    format: CustomPropTypes.numberFormat,
    parse: React.PropTypes.func,

    name: React.PropTypes.string,
    tabIndex: React.PropTypes.any,
    onKeyDown: React.PropTypes.func,
    onKeyPress: React.PropTypes.func,
    onKeyUp: React.PropTypes.func,
    autoFocus: React.PropTypes.bool,
    disabled: CustomPropTypes.disabled,
    readOnly: CustomPropTypes.disabled,

    inputProps: React.PropTypes.object,
    messages: React.PropTypes.shape({
      increment: React.PropTypes.string,
      decrement: React.PropTypes.string
    }),

    placeholder: React.PropTypes.string
  };

  static defaultProps = {
    value: null,
    open: false,

    min: -Infinity,
    max:  Infinity,
    step: 1,

    messages: {
      increment: 'increment value',
      decrement:  'decrement value'
    }
  };

  constructor(...args) {
    super(...args)

    this.focusManager = focusManager(this, {
      willHandle: focused => {
        if (focused) this.focus()
      },
    })

    this.state = {
      focused: false,
    }
  }

  @widgetEditable
  handleMouseDown = (direction, event) => {
    let { min, max } = this.props;

    event && event.persist()

    let method = direction === directions.UP
      ? this.increment
      : this.decrement

    let value = method.call(this, event)
      , atTop = direction === directions.UP && value === max
      , atBottom = direction === directions.DOWN && value === min

    if (atTop || atBottom)
      this.handleMouseUp()

    else if (!this._cancelRepeater) {
      this._cancelRepeater = createInterval(() => {
        this.handleMouseDown(direction, event)
      })
    }
  };

  @widgetEditable
  handleMouseUp = () => {
    this._cancelRepeater && this._cancelRepeater()
    this._cancelRepeater = null;
  };

  @widgetEditable
  handleKeyDown = (event) => {
    let { min, max, onKeyDown } = this.props;
    let key = event.key;

    notify(onKeyDown, [event])

    if (event.defaultPrevented)
      return

    if (key === 'End' && isFinite(max))
      this.handleChange(max, event)

    else if (key === 'Home' && isFinite(min))
      this.handleChange(min, event)

    else if ( key === 'ArrowDown') {
      event.preventDefault()
      this.decrement(event)
    }
    else if ( key === 'ArrowUp') {
      event.preventDefault()
      this.increment(event)
    }
  };

  handleChange = (rawValue, originalEvent = null) => {
    let { onChange, value: lastValue, min, max } = this.props;

    let nextValue = clamp(rawValue, min, max);

    if (lastValue !== nextValue)
      notify(onChange, [nextValue, {
        rawValue,
        lastValue,
        originalEvent,
      }])
  };

  renderInput(value) {
    let {
        placeholder
      , autoFocus
      , tabIndex
      , parse
      , name
      , onKeyPress
      , onKeyUp
      , min, max
      , disabled, readOnly
      , inputProps
      , format
      , culture } = this.props;

    return (
      <Input
        {...inputProps}
        ref='input'
        role='spinbutton'
        tabIndex={tabIndex}
        value={value}
        placeholder={placeholder}
        autoFocus={autoFocus}
        editing={this.state.focused}
        format={format}
        culture={culture}
        parse={parse}
        name={name}
        min={min}
        max={max}
        disabled={disabled}
        readOnly={readOnly}
        onChange={this.handleChange}
        onKeyPress={onKeyPress}
        onKeyUp={onKeyUp}
      />
    )
  }

  render() {
    let {
        className
      , disabled
      , readOnly
      , value
      , messages
      , min
      , max } = this.props;

    let { focused } = this.state;
    let elementProps = Props.pickElementProps(this);

    value = clamp(value, min, max);

    return (
      <Widget
        {...elementProps}
        onKeyDown={this.handleKeyDown}
        onBlur={this.focusManager.handleBlur}
        onFocus={this.focusManager.handleFocus}
        className={cn(className, 'rw-number-picker')}
      >
        <WidgetPicker
          focused={focused}
          disabled={disabled}
          readOnly={readOnly}
        >
          {this.renderInput(value)}
          <Select bordered>
            <Button
              icon="caret-up"
              onClick={this.handleFocus}
              label={messages.increment}
              disabled={value === max || disabled}
              onMouseUp={e => this.handleMouseUp(directions.UP, e)}
              onMouseDown={e => this.handleMouseDown(directions.UP, e)}
              onMouseLeave={e => this.handleMouseUp(directions.UP, e)}
            />
            <Button
              icon="caret-down"
              onClick={this.handleFocus}
              label={messages.decrement}
              disabled={value === min || disabled}
              onMouseUp={e => this.handleMouseUp(directions.DOWN, e)}
              onMouseDown={e => this.handleMouseDown(directions.DOWN, e)}
              onMouseLeave={e => this.handleMouseUp(directions.DOWN, e)}
            />
          </Select>
        </WidgetPicker>
      </Widget>
    )
  }

  focus() {
    compat.findDOMNode(this.refs.input).focus()
  }

  increment(event) {
    return this.step(this.props.step, event)
  }

  decrement(event) {
    return this.step(-this.props.step, event)
  }

  step(amount, event) {
    var value = (this.props.value || 0) + amount

    var decimals = this.props.precision != null
      ? this.props.precision
      : numberLocalizer.precision(format(this.props))

    this.handleChange(
      decimals != null ? round(value, decimals) : value,
      event
    )

    return value
  }
}


export default uncontrollable(
    NumberPicker, { value: 'onChange' }, ['focus']);



// thank you kendo ui core
// https://github.com/telerik/kendo-ui-core/blob/master/src/kendo.core.js#L1036
function round(value, precision) {
  precision = precision || 0;

  value = ('' + value).split('e');
  value = Math.round(+(value[0] + 'e' + (value[1] ? (+value[1] + precision) : precision)));

  value = ('' + value).split('e');
  value = +(value[0] + 'e' + (value[1] ? (+value[1] - precision) : -precision));

  return value.toFixed(precision);
}