import * as React from 'react'
import {DropTarget} from 'react-dnd'
import {Types} from './Types'
import {itemTarget} from './Item'

var Placeholder = React.createClass({
  render() {
    let res = <div className="list-group-item placeholder">
      &#x2662;
    </div>
    return this.props.connectDropTarget(res)
  }
})

export var Placeholder = DropTarget([Types.ITEM, Types.PLAYLIST], itemTarget, connect => ({
    connectDropTarget: connect.dropTarget()
  }))(Placeholder)


