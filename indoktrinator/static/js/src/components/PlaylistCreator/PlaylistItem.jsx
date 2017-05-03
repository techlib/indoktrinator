import * as React from 'react'
import moment from 'moment'
import {DragSource} from 'react-dnd'
import {Types} from './Types'
import {Icon} from '../Icon'
import ReactImageFallback from "react-image-fallback"

const itemSource = {
  beginDrag(props) {
    return {
      uuid: Date.now(),
      duration: props.file.duration,
      _file: props.file,
      added: false,
      hide: true,
      _type: Types.PLAYLIST_ITEM
    }
  },

  endDrag(props, monitor) {
    if (monitor.didDrop()) {
      props.finalizeDrop()
    } else {
      props.cancelDrop()
    }
  }

}

var PlaylistItemComponent = React.createClass({

  void(e) {
    // stop propagating event to prevent it from reaching higher element in
    // bootstrap panel - clicking file would collapse the open playlist
    e.stopPropagation()
  },

	add() {
		this.props.addHandler({
			uuid: Date.now(),
			duration: this.props.file.duration,
			_file: this.props.file,
			_type: Types.ITEM
		})
	},

  render() {
    let res = <div className="list-group-item" onClick={this.void}>
        <div className="list-view-pf-main-info">
          <div className="list-view-pf-left">
            <ReactImageFallback src={this.props.file.preview} fallbackImage="/static/img/video.png" width="80" height="45" />
          </div>
          <div className="list-view-pf-body">
            <div className="list-view-pf-description">
              <div className="list-group-item-heading">
                {this.props.file.path}
              </div>
            </div>
            <div className="list-view-pf-additional-info">
              <div className="list-view-pf-additional-info-item">
                <Icon fa="clock-o" /> {moment.duration(this.props.file.duration, 'seconds').format('mm:ss', {trim: false})}
              </div>
            </div>
          </div>
        </div>
        <div className="list-view-pf-actions">
          <button onClick={this.add} type="button" className="close">
            <Icon fa="plus" />
          </button>
        </div>
      </div>

    return this.props.connectDragSource(res)
  }
})

export var PlaylistItem = DragSource(Types.PLAYLIST_ITEM, itemSource, (connect, monitor) => ({
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging()
  }))(PlaylistItemComponent)

