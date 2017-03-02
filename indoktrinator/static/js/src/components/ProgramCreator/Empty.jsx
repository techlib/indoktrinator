import * as React from 'react'
import {itemTarget} from './Item'
import {DropTarget} from 'react-dnd'
import {Types} from './Types'

var EmptyComponent = React.createClass({
  render() {
    return this.props.connectDropTarget(
      <div className="list-group-item empty">&diams;</div>
    )
  }
})

export var Empty = DropTarget([Types.ITEM, Types.PLAYLIST], itemTarget, connect => ({
  connectDropTarget: connect.dropTarget()
}))(EmptyComponent)
