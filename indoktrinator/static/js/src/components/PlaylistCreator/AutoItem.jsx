import {flow} from 'lodash'
import {DragSource, DropTarget} from 'react-dnd'
import {Item} from './Item'
import {Types} from './Types'

const itemSource = {
  beginDrag(props, monitor) {
    return {
      uuid: props.uuid,
      index: props.index,
      path: props.path,
      file: props.file,
      duration: props.duration,
      type: props.type,
      _type: 'auto',
      all_props: props
    }
  },
  endDrag(props, monitor, component) {
    if (monitor.didDrop()) {
      props.finalizeDrop()
    } else {
      props.cancelDrop()
    }
  }
}

export var AutoItem = flow(
  DragSource(Types.AUTO_ITEM, itemSource, (connect, monitor) => ({
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging()
  }))
)(Item)
