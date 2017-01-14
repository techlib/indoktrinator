import * as React from 'react'
import classNames from 'classnames'
import moment from 'moment'
import {DragSource} from 'react-dnd'
import {Types} from './Types'
import {findDOMNode} from 'react-dom'
import {PlaylistItem} from './PlaylistItem'

const playlistSource = {
  beginDrag(props, monitor, component) {
    return {
      uuid: Date.now(),
      items: props.items,
      added: false,
      hide: true,
      file: {},
      _type: Types.PLAYLIST
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

var Playlist = React.createClass({

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
        {this.props.items.map((item, index) => {
          return <PlaylistItem
                  finalizeDrop={this.props.finalizeDrop}
                  cancelDrop={this.props.cancelDrop}
                  addHandler={this.props.appendItem}
                  file={item.file} />
        })}
      </div>
    )
  },

  add(e) {
    this.props.appendItem({
      uuid: Date.now(),
      duration: 0,
      items: this.props.items,
      file: {},
      _type: Types.PLAYLIST,
    })
    e.stopPropagation()
  },


  render() {
    const clsArrow = classNames('fa', 'fa-fw', this.state.open ? 'fa-angle-down' : 'fa-angle-right')
    const clsMain = classNames('list-group-item', {'list-view-pf-expand-active': this.state.open})
    const {connectDragSource} = this.props

    let res = (
      <div onClick={this.toggle} className={clsMain}>
        <div className="list-group-item-header">
          <div className="list-view-pf-main-info">
            <div className="list-view-pf-left">
               <span className={clsArrow}> </span>
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
                <span className="fa fa-plus"></span>
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
  }))(Playlist)

