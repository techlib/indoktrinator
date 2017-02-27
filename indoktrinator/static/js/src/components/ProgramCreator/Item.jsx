import * as React from 'react'
import * as ReactDOM from 'react-dom'
import {DragSource, DropTarget} from 'react-dnd'
import {Types} from './Types'
import {findDOMNode} from 'react-dom'
import {flow, isInteger, range} from 'lodash'
import {Overlay, OverlayTrigger, Popover} from 'react-bootstrap'
import {Col, Row, Form, FormGroup, ControlLabel} from 'react-bootstrap'
import TimePicker from 'rc-time-picker';
import classNames from 'classnames'
import moment from 'moment'
import 'rc-time-picker/assets/index.css';
import {translate} from 'react-i18next'
import {UuidToRgba} from '../../util/color'
import {momentToS, sToMoment} from '../../util/time'

const itemSource = {
  beginDrag(props, monitor, component) {

    props.makeDirty(props.index)

    return {
      uuid: Date.now(),
      index: props.index,
      range: [props.range[0], props.range[1]],
      added: props.day,
      empty: false,
      duration: props.playlist.duration,
      _playlist: props.playlist,
      _type: Types.ITEM
    }
  }
}

export const itemTarget = {
  hover(props, monitor, component) {

    if (monitor.getItem().added === false || monitor.getItem().added != props.day) {
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

  getCurrentRepeat() {
    let duration = this.props.playlist.duration

    if (duration == 0) {
      return 0
    }

    let currentLength = this.state.end - this.state.start
    return currentLength / duration
  },

  save() {
    this.props.save(this.state.start, this.state.end)
    this.open() //TODO too early, won't render data properly
  },

  delete() {
    this.props.delete(this.props.index)
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
    const {t} = this.props

    return <div className="edit">
      <div className="panel panel-default">
        <div className="panel-heading">
          <span>{this.props.playlist.name}</span>
          <button type="button" onClick={this.open} className="close">
            <span >&times;</span>
          </button>
        </div>
        <div className="panel-body">
          <Form horizontal>
            <FormGroup>
              <Col componentClass={ControlLabel} xs={4}>
                {this.props.t('program:labels.start')}
              </Col>
              <Col xs={6}>
                <TimePicker
                  disabledHours={this.getDisabledHours}
                  disabledMinutes={this.getDisabledMinutes}
                  disabledSeconds={this.getDisabledSeconds}
                  hideDisabledOptions={true}
                  value={sToMoment(this.state.start)}
                  onChange={this.updateStart}
                  showSecond={false}
                />
              </Col>
            </FormGroup>

            <FormGroup>
              <Col componentClass={ControlLabel} xs={4}>
                {this.props.t('program:labels.end')}
              </Col>
              <Col xs={6}>
                 <TimePicker
                  value={sToMoment(this.state.end)}
                  onChange={this.updateEnd}
                  showSecond={false}
                  />
              </Col>
            </FormGroup>
          </Form>
    </div>

    <div className="panel-footer">
      <div className="row">
        <div className="col-xs-6 text-left">
            <a className="text-danger" onClick={this.delete}>
              <span className="fa fa-trash"></span> {t('program:buttons.edit.delete')}
            </a>
        </div>

        <div className="col-xs-6 text-right">
            <a className="btn btn-primary" onClick={this.save}>
              {t('program:buttons.edit.save')}
            </a>
        </div>
      </div>
    </div>
    </div>
		</div>
	},

  render() {
    const from = moment().startOf('day')
                         .second(this.props.range[0]).format('HH:mm')
    const to =   moment().startOf('day')
                         .second(this.props.range[1]).format('HH:mm')

		var style = {}
		if (this.state.edit) {
			style.backgroundColor = '#efe'
		}

    var classes = classNames('list-group-item',
                            {'list-group-item-warning': this.props.empty})

		style.backgroundColor = UuidToRgba(this.props.playlist.uuid)

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

)(translate(['common', 'program'])(Item))


