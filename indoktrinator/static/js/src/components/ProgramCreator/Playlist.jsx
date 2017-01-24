import * as React from 'react'
import {DragSource} from 'react-dnd'
import {Types} from './Types'
import classNames from 'classnames'

const playlistSource = {
  beginDrag(props, monitor, component) {
    var duration = Math.floor(Math.max(props.duration, 10))
    return {
      uuid: Date.now(),
      index: props.index,
      added: false,
      empty: false,
      _playlist: {
        name: props.name,
        uuid: props.uuid,
        duration: duration
      },
      range: [0, duration],
      _type: Types.PLAYLIST

    }
  },
}

var Playlist = React.createClass({

  render() {
    let cls = classNames('list-group-item')
    let res =  <li className={cls}>
      {this.props.name}
    </li>

		return this.props.connectDragSource(res)
  }
})

export var Playlist = DragSource(Types.PLAYLIST, playlistSource, (connect, monitor) => ({
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging()
}))(Playlist)
