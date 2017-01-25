import * as React from 'react'
import {DropTarget} from 'react-dnd'
import {Types} from './Types'
import {itemTarget} from './Item'

export var Empty = React.createClass({
  render() {
    return <div className="list-group-item empty">&diams;</div>
  }
})
