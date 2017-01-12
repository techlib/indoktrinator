import {DragSource, DropTarget} from 'react-dnd'
import {Types} from './Types'
import {flow} from 'lodash'
import {findDOMNode} from 'react-dom'
import * as React from 'react'
import {FormattedMessage} from 'react-intl'
import moment from 'moment'
import 'moment-duration-format'

const itemSource = {
  beginDrag(props, monitor, component) {
    return {
      uuid: props.uuid,
      index: props.index,
      file: props.file,
      duration: props.duration,
      _type: Types.ITEM
    }
  }
}

export const itemTarget = {
  hover(props, monitor, component) {
    if ((monitor.getItem()._type === Types.PLAYLIST_ITEM ||
         monitor.getItem()._type === Types.PLAYLIST)
      && monitor.getItem().added == false) {
        props.addToItems(monitor.getItem(), component.props.index + 1)
        monitor.getItem().index = component.props.index + 1
        monitor.getItem().added = true
        return
    }

    const dragIndex = monitor.getItem().index
    const hoverIndex = props.index

    // Don't replace items with themselves
    if (dragIndex === hoverIndex) {return}

    // Determine rectangle on screen
    const hoverBoundingRect = findDOMNode(component).getBoundingClientRect()
    // Get vertical middle
    const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2
    // Determine mouse position
    const clientOffset = monitor.getClientOffset()
    // Get pixels to the top
    const hoverClientY = clientOffset.y - hoverBoundingRect.top

    // Dragging downwards
    if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {return}

    // Dragging upwards
    if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {return}

    props.moveItem(dragIndex, hoverIndex)
    monitor.getItem().index = hoverIndex
  }
}

var Item = React.createClass({

  delete() {
    this.props.deleteItemHandler(this.props.index)
  },

  render() {
    const {connectDragSource, connectDropTarget} = this.props
    const opacity = this.props.isDragging || this.props.hide ? 0 : 1
    let item = (
        <div className="list-group-item" style={{opacity}}>
          <div className="list-view-pf-main-info">
            <div className="list-view-pf-left">
              <img src={this.props.file.preview} style={{height: 32, width: 32}}
                   alt="placeholder image"/>
            </div>
            <div className="list-view-pf-body">
              <div className="list-view-pf-description">
                <div className="list-group-item-heading">
                  {this.props.file.path}
                </div>
              </div>
              <div className="list-view-pf-additional-info">
                  <i className="fa fa-clock-o"> </i> {moment.duration(this.props.file.duration, 'seconds').format('mm:ss', {trim: false})}
              </div>
            </div>
          </div>
            <div className="list-view-pf-actions">
              <button onClick={this.delete} type="button" className="close">
                  <span className="pficon pficon-close"> </span>
              </button>
            </div>
        </div>
      )

    return connectDropTarget(connectDragSource(item))
  }

})

export var Item = flow(

  DropTarget([Types.ITEM, Types.PLAYLIST_ITEM, Types.PLAYLIST], itemTarget, connect => ({
    connectDropTarget: connect.dropTarget()
  })),

  DragSource(Types.ITEM, itemSource, (connect, monitor) => ({
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging()
  }))

)(Item)

