import * as React from 'react'
import {DragSource} from 'react-dnd'
import {Types} from './Types'
import classNames from 'classnames'
import {UuidToRgba} from '../../util/color'

const playlistSource = {
  beginDrag(props) {
    var duration = Math.floor(Math.max(props.duration, 3600))
    return {
      uuid: Date.now(),
      index: props.index,
      added: false,
      empty: false,
      mode: 'full',
      sidebar: null,
      panel: null,
      _playlist: {
        name: props.name,
        uuid: props.uuid,
        duration: duration
      },
      range: [0, duration],
      _type: Types.PLAYLIST

    }
  },

  endDrag(props, monitor) {
    if (!monitor.didDrop()) {
      props.cleanup()
    }
  }
}

var PlaylistComponent = React.createClass({

  render() {
    let style = {backgroundColor: UuidToRgba(this.props.uuid)}
    let cls = classNames('list-group-item', 'playlist')
    let res =  <li className={cls} style={style}>
      {this.props.name}
    </li>

		return this.props.connectDragSource(res)
  }
})

export var Playlist = DragSource(Types.PLAYLIST, playlistSource, (connect, monitor) => ({
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging()
}))(PlaylistComponent)
