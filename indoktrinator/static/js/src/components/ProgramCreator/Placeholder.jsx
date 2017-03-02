import * as React from 'react'
import {DropTarget} from 'react-dnd'
import {Types} from './Types'

var target = {
  hover(props, monitor, component) {
    var newIndex

    if (monitor.getItem().added === false || monitor.getItem().added != props.day) {
      newIndex = props.addToItems(monitor.getItem())
      monitor.getItem().index = newIndex
      monitor.getItem().added = props.day
      props.cleanup(monitor.getItem().added)
      return
    }
		
    if (monitor.getItem().added == props.day) {
      newIndex = component.props.index

      if (newIndex == props.index) {
        return
      }

      props.moveItem(props.index, newIndex)
      monitor.getItem().index = newIndex
			return
		}

  },

  drop(props) {
    props.dropPlaylist()
  }

}

var PlaceholderComponent = React.createClass({
  render() {
    let res = <div className="list-group-item placeholder">
      &#x2662;
    </div>
    return this.props.connectDropTarget(res)
  }
})

export var Placeholder = DropTarget([Types.ITEM, Types.PLAYLIST], target, connect => ({
    connectDropTarget: connect.dropTarget()
}))(PlaceholderComponent)


