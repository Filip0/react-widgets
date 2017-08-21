import React from 'react';

import PropTypes from 'prop-types';

import MultiselectTag from './MultiselectTag';
import * as CustomPropTypes from './util/PropTypes';
import { dataIndexOf } from './util/dataHelpers';

// disabled === true || [1, 2, 3, etc]
const isDisabled = (item, list, value) =>
  !!(Array.isArray(list) ? ~dataIndexOf(list, item, value) : list)

class MultiselectTagList extends React.Component {

  static propTypes ={
    id: PropTypes.string.isRequired,
    activeId: PropTypes.string.isRequired,
    label: PropTypes.string,

    value: PropTypes.array,
    focusedItem: PropTypes.any,

    valueAccessor: PropTypes.func.isRequired,
    textAccessor: PropTypes.func.isRequired,

    onDelete: PropTypes.func.isRequired,
    valueComponent: PropTypes.func,

    disabled: CustomPropTypes.disabled.acceptsArray,
  };

  handleDelete = (item, event) => {
    if (this.props.disabled !== true)
      this.props.onDelete(item, event)
  };

  render() {
    let {
        id
      , value
      , activeId
      , valueAccessor
      , textAccessor
      , label
      , disabled
      , focusedItem
      , valueComponent: ValueComponent }  = this.props;

    return (
      <ul
        id={id}
        tabIndex='-1'
        role='listbox'
        aria-label={label}
        className='rw-multiselect-taglist'
      >
        {value.map((item, i) => {
          let isFocused = focusedItem === item;

          return (
            <MultiselectTag
              key={i}
              id={`${activeId}_${item.id}`}
              value={item}
              focused={isFocused}
              onClick={this.handleDelete}
              disabled={isDisabled(item, disabled, valueAccessor)}
            >
              {ValueComponent
                ? <ValueComponent item={item} />
                : <span>{textAccessor(item)}</span>
              }
            </MultiselectTag>
          )
        })}
      </ul>
    )
  }
}

export default MultiselectTagList
