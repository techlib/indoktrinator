import {flow} from 'lodash'
import {DragSource, DropTarget} from 'react-dnd'
import {Item} from './Item'
import {Types} from './Types'

const itemSource = {
  beginDrag(props, monitor) {
    return {
      uuid: Date.now(),
      added: false,
      hide: true,
      file: props.item.file,
      _type: Types.PLAYLIST_ITEM
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
  DragSource(Types.PLAYLIST_ITEM, itemSource, (connect, monitor) => ({
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging()
  }))
)(Item)
