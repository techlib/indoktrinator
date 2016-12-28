import {DragSource, DropTarget} from 'react-dnd'
import {Item} from './Item'
import {Types} from './Types'
import {flow} from 'lodash'
import {findDOMNode} from 'react-dom'
import {v4 as uuid} from 'uuid'
import * as React from 'react'
import {FormattedMessage} from 'react-intl'

const itemSource = {
  beginDrag(props, monitor, component) {
    return {
      uuid: props.uuid,
      index: props.index,
      path: props.path,
      file: props.file,
      type: props.type,
      deleteItemHandler: props.deleteItemHandler,
      _type: 'synth',
      all_props: props
    }
  }
}

const synthTarget = {
  hover(props, monitor, component) {
    // by https://github.com/gaearon/react-dnd/blob/master/examples/04%20Sortable/Simple/Card.js
    if (monitor.getItem().type === Types.AUTO_ITEM) {
      return false
    }

    const dragIndex = monitor.getItem().index
    const hoverIndex = props.index

    // Don't replace items with themselves
    if (dragIndex === hoverIndex) {
      return
    }

    // Determine rectangle on screen
    const hoverBoundingRect = findDOMNode(component).getBoundingClientRect()

    // Get vertical middle
    const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2

    // Determine mouse position
    const clientOffset = monitor.getClientOffset()

    // Get pixels to the top
    const hoverClientY = clientOffset.y - hoverBoundingRect.top

    // Dragging downwards
    if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
      return
    }

    // Dragging upwards
    if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
      return
    }

    props.moveCard(dragIndex, hoverIndex)

    monitor.getItem().index = hoverIndex
  },
  drop(props, monitor, component) {
    const item = monitor.getItem()
    const dragIndex = item.index
    const hoverIndex = props.index

    if (dragIndex == hoverIndex && item._type != 'auto') {
      return
    }

    if (!item.added && item._type == 'auto') {
      item.reactKey = uuid()
      props.addToSynth(item, component.props.index + 1)
      monitor.getItem().added = true
      monitor.getItem().type = Types.SYNTH_ITEM
    }
  }
}

class PlaceholderForInitialDrag extends React.Component {

  render() {
    const {
      //React DnD
      connectDropTarget} = this.props

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
    connectDropTarget: connect.dropTarget()
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

