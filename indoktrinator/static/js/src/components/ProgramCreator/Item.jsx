import * as React from 'react'
import * as ReactDOM from 'react-dom'
import {DragSource, DropTarget} from 'react-dnd'
import {Types} from './Types'
import {findDOMNode} from 'react-dom'
import {flow, isInteger, range} from 'lodash'
import {Overlay, OverlayTrigger, Popover} from 'react-bootstrap'
import TimePicker from 'rc-time-picker';
import classNames from 'classnames'
import moment from 'moment'
import 'rc-time-picker/assets/index.css';

function momentToS(m) {
  return m.second() + m.minute() * 60 + m.hour() * 3600
}

function sToMoment(s) {
  return moment().startOf('day').second(s)
}

const itemSource = {
  beginDrag(props, monitor, component) {
    return {
      uuid: props.uuid,
      index: props.index,
      range: [0,0],
      duration: props.playlist.duration,
      _playlist: this.props,
      _type: Types.ITEM
    }
  }
}

export const itemTarget = {
  hover(props, monitor, component) {
    if ((monitor.getItem()._type === Types.PLAYLIST) // ITEM from different day
      && monitor.getItem().added === false) {
        props.addToItems(monitor.getItem(), component.props.index + 1)
        monitor.getItem().index = component.props.index + 1
        monitor.getItem().added = props.day
        return
      }

    if ((monitor.getItem()._type === Types.PLAYLIST) // ITEM from different day
      && monitor.getItem().added != props.day) {
        props.addToItems(monitor.getItem(), component.props.index + 1)
        monitor.getItem().index = component.props.index + 1
        monitor.getItem().added = props.day
        props.cleanup(monitor.getItem().added)
        return
      }

    const dragIndex = monitor.getItem().index
    const hoverIndex = props.index

    if (dragIndex === hoverIndex) {return}

    const hoverBoundingRect = findDOMNode(component).getBoundingClientRect()
    const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2
    const clientOffset = monitor.getClientOffset()
    const hoverClientY = clientOffset.y - hoverBoundingRect.top

    if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {return}
    if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {return}

    props.moveItem(dragIndex, hoverIndex)
    monitor.getItem().index = hoverIndex
  },

  drop(props, monitor, component) {
    props.dropPlaylist()
  }

}


var Item = React.createClass({

	getInitialState() {
		return {
      edit: false,
      range: this.props.range,
      start: this.props.range[0],
      end: this.props.range[1],
      duration: this.props.range[1] - this.props.range[0],
		}
	},

  open() {
    var state = this.getInitialState()
    state.edit = !this.state.edit
    this.setState(state)
	},

  updateStart(v) {
    if (v === null) {
      return
    }
    var s = momentToS(v)
    this.setState({start: s,
                   end: s + this.state.end - this.state.start})
  },

  updateEnd(v) {
    if (v === null) {
      return
    }
    this.setState({end: momentToS(v)})
  },

  updateLength(v) {
    if (v === null) {
      return
    }
    this.setState({end: this.state.start + momentToS(v)})
  },


  getCurrentRepeat() {
    let duration = this.props.playlist.duration

    if (duration == 0) {
      return 0
    }

    let currentLength = this.state.end - this.state.start
    return currentLength / duration
  },

  getRepeatUI() {
    let val = this.getCurrentRepeat()
    if (isInteger(val)) {
      return val
    }
    return ''
  },

  repeat(val) {
    let l = (Math.floor(this.getCurrentRepeat()) + val) * this.props.playlist.duration
    this.updateLength(sToMoment(l))
  },

  repeatMinus() {
    this.repeat(-1)
  },
  repeatPlus() {
    this.repeat(1)
  },

  save() {
    this.props.save(this.state.start, this.state.end)
    this.open() //TODO too early, won't render data properly
  },

  getDisabledHours() {
    let minHour = sToMoment(this.props.prevEnd).hour()
    return range(0, minHour)
  },

  getDisabledMinutes() {
    let minTime = sToMoment(this.props.prevEnd)
    let start = sToMoment(this.state.start)
    if (minTime.hour() == start.hour()) {
      return range(0, minTime.minute())
    }
    return []
  },

  getDisabledSeconds() {
    let minTime = sToMoment(this.props.prevEnd)
    let start = sToMoment(this.state.start)
    if (minTime.hour() == start.hour()
        && minTime.minute() == start.minute()) {
      return range(0, minTime.second())
    }
    return []
  },

	getEdit() {
    return <div className="edit">
      <div className="panel panel-default">
        <div className="panel-heading">Moo</div>
        <div className="panel-body">
      Start:<br/>
      <TimePicker
        disabledHours={this.getDisabledHours}
        disabledMinutes={this.getDisabledMinutes}
        disabledSeconds={this.getDisabledSeconds}
        hideDisabledOptions={true}
        value={sToMoment(this.state.start)}
        onChange={this.updateStart}
      />

			<hr />
      Length:<br/>
      <TimePicker
        value={sToMoment(this.state.end - this.state.start)}
          onChange={this.updateLength}
      />

      End:<br/>
      <TimePicker
        value={sToMoment(this.state.end)}
        onChange={this.updateEnd}
      />

      {!this.props.empty &&
        (<div>Repeat playlist:<br/>
      <button onClick={this.repeatMinus}>-</button>
      <input value={this.getRepeatUI()} size="4" type="text"/>
      <button onClick={this.repeatPlus}>+</button>
      <br /></div>)
      }
      <a onClick={this.open}>Cancel</a>
      <br />
      <a onClick={this.save}>Save</a>
    </div>
    <div className="panel-footer">moo</div>
    </div>
		</div>
	},

  render() {
    const from = moment().startOf('day')
                         .second(this.props.range[0]).format('HH:mm:ss')
    const to =   moment().startOf('day')
                         .second(this.props.range[1]).format('HH:mm:ss')

		var style = {}
		if (this.state.edit) {
			style['backgroundColor'] = '#efe'
		}

    var classes = classNames('list-group-item',
                            {'list-group-item-warning': this.props.empty})

    let res = (
      <div className={classes} onClick={!this.state.edit && this.open} style={style}>
      			<span className="time">{from} - {to}</span>
            {this.props.playlist.name}
						{this.state.edit && this.getEdit()}
      </div>
    )

    return this.state.edit
      ? res
      : this.props.connectDropTarget(this.props.connectDragSource(res))
  }

})

export var Item = flow(
	DropTarget([Types.ITEM, Types.PLAYLIST], itemTarget, connect => ({
    connectDropTarget: connect.dropTarget()
  })),

  DragSource(Types.ITEM, itemSource, (connect, monitor) => ({
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging()
  }))

)(Item)


