var React = require('react')
  , cx = require('react/lib/cx')
  , dates = require('../util/dates')
  , transferProps = require('../util/transferProps')
  , globalize = require('globalize')
  , _ = require('lodash')


module.exports = React.createClass({

  propTypes: {
    value:  React.PropTypes.instanceOf(Date),
    month:  React.PropTypes.number,
    year:   React.PropTypes.number,
  },

  render: function(){
    var day = this.props.value
      , props = _.omit(this.props, 'value');

    return transferProps(props,
      <td className={cx({ 
          'rw-off-range': dates.month(day) !== this.props.month
        })}>
        <btn>{globalize.format(day, 'dd')}</btn>
      </td>
    )
  }
})

var btn = require('../common/btn.jsx')