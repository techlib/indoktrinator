import * as React from 'react'
import classNames from 'classnames'
import {DragSource} from 'react-dnd'
import {Types} from './Types'
import {PlaylistItem} from './PlaylistItem'
import {Icon} from '../Icon'

const playlistSource = {
  beginDrag(props) {
    return {
      uuid: Date.now(),
      items: props.items,
      added: false,
      hide: true,
      _file: {},
      _type: Types.PLAYLIST
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

var PlaylistComponent = React.createClass({

  getInitialState() {
    return {
      open: false
    }
  },

  toggle() {
    this.setState({
      open: !this.state.open
    })
  },

  getItems() {
    if (this.props.items.length == 0) {
      return null
    }

    if (!this.state.open) {
      return null
    }

    return (
      <div className="list-group-item-container">
        {this.props.items.map((item) => {
          return <PlaylistItem
                  finalizeDrop={this.props.finalizeDrop}
                  cancelDrop={this.props.cancelDrop}
                  addHandler={this.props.appendItem}
                  file={item._file} />
        })}
      </div>
    )
  },

  add(e) {
    this.props.appendItem({
      uuid: Date.now(),
      duration: 0,
      items: this.props.items,
      _file: {},
      _type: Types.PLAYLIST,
    })
    e.stopPropagation()
  },


  render() {
    const clsArrow = this.state.open ? 'angle-down' : 'angle-right'
    const clsMain = classNames('list-group-item', {'list-view-pf-expand-active': this.state.open})
    const {connectDragSource} = this.props

    let res = (
      <div onClick={this.toggle} className={clsMain}>
        <div className="list-group-item-header">
          <div className="list-view-pf-main-info">
            <div className="list-view-pf-left">
              <Icon fa={clsArrow} className="fa-fw" />
            </div>

            <div className="list-view-pf-body">
              <div className="list-view-pf-description">
                <div className="list-group-item-heading">
                  {this.props.name}
                </div>
              </div>
            </div>
            <div className="list-view-pf-actions">
              <button onClick={this.add} type="button" className="close">
                <Icon fa="plus" />
              </button>
            </div>
        </div>
      </div>
      {this.getItems()}
      </div>
  )
  return connectDragSource(res)
  }

})

export var Playlist = DragSource(Types.PLAYLIST, playlistSource, (connect, monitor) => ({
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging()
  }))(PlaylistComponent)

