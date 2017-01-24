import * as React from 'react'
import {DropTarget} from 'react-dnd'
import {Types} from './Types'
import {itemTarget} from './Item'

var Empty = React.createClass({
  render() {
    let res = <div className="list-group-item empty">&diams;</div>
    return this.props.connectDropTarget(res)
  }
})

export var Empty = DropTarget([Types.ITEM, Types.PLAYLIST], itemTarget, connect => ({
    connectDropTarget: connect.dropTarget()
  }))(Empty)


