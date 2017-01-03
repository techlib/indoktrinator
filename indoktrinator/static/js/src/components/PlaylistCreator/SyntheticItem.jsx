import {DragSource, DropTarget} from 'react-dnd'
import {Item} from './Item'
import {Types} from './Types'
import {flow} from 'lodash'
import {findDOMNode} from 'react-dom'
import * as React from 'react'
import {FormattedMessage} from 'react-intl'

const itemSource = {
  beginDrag(props, monitor, component) {
    return {
      uuid: props.item.uuid,
      index: props.index,
      item: props.item,
      _type: Types.SYNTH_TYPE
    }
  }
}

const synthTarget = {
  hover(props, monitor, component) {

    if (monitor.getItem()._type === Types.AUTO_ITEM
      && monitor.getItem().added == false) {
        props.addToSynth(monitor.getItem(), component.props.index + 1)
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

class PlaceholderForInitialDrag extends React.Component {

  render() {
    const {connectDropTarget} = this.props

    return connectDropTarget(<div className="list-group-item">
      <div className="list-view-pf-main-info">
        <div className="list-view-pf-body">
          <div className="list-view-pf-description">
            <div className="list-group-item-heading" style={{textAlign: 'center'}}>
              <FormattedMessage
                id="app.menu.event.item.dragAndDropExample"
                description="Text"
                defaultMessage="Drag and drop here!"
              />
            </div>
          </div>
        </div>
      </div>
    </div>)
  }
}

PlaceholderForInitialDrag = DropTarget(Types.AUTO_ITEM,
  synthTarget,
  connect => ({
    connectDropTarget: connect.dropTarget(),
    index: -1 // stupid hack, but we need index in hover(), which is then inremented
              // by one to add new item. This for cases, where there are no items
  }))(PlaceholderForInitialDrag)

export default PlaceholderForInitialDrag

export var SyntheticItem = flow(

  DropTarget([Types.SYNTH_ITEM, Types.AUTO_ITEM], synthTarget, connect => ({
    connectDropTarget: connect.dropTarget()
  })),

  DragSource(Types.SYNTH_ITEM, itemSource, (connect, monitor) => ({
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging()
  }))

)(Item)

