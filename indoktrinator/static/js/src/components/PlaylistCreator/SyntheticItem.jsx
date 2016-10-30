import {DragSource, DropTarget} from "react-dnd";
import {Item} from "./Item";
import {Types} from "./Types";
import {flow} from "lodash";
import {findDOMNode} from "react-dom";

const itemSource = {
  beginDrag(props, monitor, component) {
    return {
      uuid: props.uuid,
      index: props.index,
      path: props.path,
      type: props.type,
      _type: 'synth',
      all_props: props
    };
  }
};

const synthTarget = {
  hover(props, monitor, component) {
    const item = monitor.getItem()
    const dragIndex = item.index;
    const hoverIndex = props.index;

    if (dragIndex == hoverIndex && item._type != 'auto') {
      return;
    }

    if (!item.added && item._type == 'auto') {
      props.addToSynth(item, component.props.index + 1)
      monitor.getItem().index = component.props.index + 1
      monitor.getItem().added = true
    } else {
      props.moveCard(dragIndex, hoverIndex);
      monitor.getItem().index = hoverIndex;
    }

  }

}

export var SyntheticItem = flow(
  DropTarget([Types.SYNTH_ITEM, Types.AUTO_ITEM], synthTarget, connect => ({
    connectDropTarget: connect.dropTarget()
  })),

  DragSource(Types.SYNTH_ITEM, itemSource, (connect, monitor) => ({
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging()
  }))
)(Item)

