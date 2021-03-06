import * as React from 'react'
import {DragSource, DropTarget} from 'react-dnd'
import {Types} from './Types'
import {findDOMNode} from 'react-dom'
import {flow, range} from 'lodash'
import {Radio, Col, Row, Form, FormGroup, FormControl, ControlLabel, Panel, Popover, OverlayTrigger} from 'react-bootstrap'
import TimePicker from 'rc-time-picker'
import classNames from 'classnames'
import moment from 'moment'
import 'rc-time-picker/assets/index.css'
import {translate} from 'react-i18next'
import {UuidToRgba} from '../../util/color'
import {momentToS, sToMoment} from '../../util/time'
import {Icon} from '../Icon'
import {notEmpty} from '../../util/simple-validators.js'
import {includes} from 'lodash'

const itemSource = {
  beginDrag(props) {

    props.makeDirty(props.index)

    return {
      uuid: Date.now(),
      index: props.index,
      range: [props.range[0], props.range[1]],
      mode: props.mode,
      sidebar: props.sidebar,
      panel: props.panel,
      added: props.day,
      empty: false,
      duration: props.playlist.duration,
      _playlist: props.playlist,
      _type: Types.ITEM,
    }
  },

  endDrag(props, monitor) {
    if (!monitor.didDrop()) {
      props.cleanup()
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

  drop(props) {
    props.dropPlaylist()
  }

}

var ItemComponent = React.createClass({

	getInitialState() {
    return {
      range: this.props.range,
      start: this.props.range[0],
      end: this.props.range[1],
      duration: this.props.range[1] - this.props.range[0],
      mode: this.props.mode,
      sidebar: this.props.sidebar,
      panel: this.props.panel,
      errors: []
		}
	},

  componentWillReceiveProps(p) {
    this.setState({
      range: p.range,
      start: p.range[0],
      end: p.range[1],
      duration: p.range[1] - p.range[0],
      mode: p.mode,
      sidebar: p.sidebar,
      panel: p.panel
    })
  },

  close() {
    this.refs.edit.hide()
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

  save() {
    var errors = this.validateEdit()

    if (errors.length == 0) {
      this.props.save(this.state.start, this.state.end,
                      this.state.mode, this.state.sidebar, this.state.panel)
      this.close() //TODO too early, won't render data properly
    }

    this.setState({
      errors: errors
    })
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

  getDisabledHoursEnd() {
    let minHour = sToMoment(this.state.start).hour()
    return range(0, minHour)
  },

  getDisabledMinutesEnd() {
    let minTime = sToMoment(this.state.start)
    let start = sToMoment(this.state.end)
    if (minTime.hour() == start.hour()) {
      return range(0, minTime.minute() + 1)
    }
    return []
  },

  handleMode(e) {
    this.setState({mode: e.target.value})
  },

  handleUrl(e) {
    var data = {}
    data[e.target.name] = e.target.value
    this.setState(data)
  },

  validateEdit() {
    var errors = []

    if (this.state.mode == 'sidebar' || this.state.mode == 'panel') {
      if (!notEmpty(this.state.sidebar)) {
        errors.push('sidebar')
      }
    }

    if (this.state.mode == 'panel') {
      if (!notEmpty(this.state.panel)) {
        errors.push('panel')
      }
    }

    return errors
  },

  getEdit() {
    const {t} = this.props

    var header = (
      <div>
        <span>{this.props.playlist.name}</span>
        <button type="button" onClick={this.close} className="close">
          <span >&times;</span>
        </button>
      </div>
    )

    var footer = (
      <Row>
        <Col xs={6} className="text-left">
          <a className="text-danger" onClick={this.delete}>
            <Icon fa='trash' /> {t('program:buttons.edit.delete')}
          </a>
        </Col>
        <Col xs={6} className="text-right">
          <a className="btn btn-primary" onClick={this.save}>
            {t('program:buttons.edit.save')}
          </a>
        </Col>
      </Row>
    )

    return <Popover className="edit" id={`edit-${this.props.uuid}`}>
      <Panel header={header} footer={footer}>
        <Form horizontal>
          <FormGroup>
            <Col componentClass={ControlLabel} xs={4}>
              {this.props.t('program:labels.start')}
            </Col>
            <Col xs={6}>
              <TimePicker
                getPopupContainer={() => {return this.refs.time1}}
                disabledHours={this.getDisabledHours}
                disabledMinutes={this.getDisabledMinutes}
                hideDisabledOptions={true}
                value={sToMoment(this.state.start)}
                onChange={this.updateStart}
                showSecond={false}
              />
              <div ref="time1" />
            </Col>
          </FormGroup>

          <FormGroup>
            <Col componentClass={ControlLabel} xs={4}>
              {this.props.t('program:labels.end')}
            </Col>
            <Col xs={6}>
               <TimePicker
                getPopupContainer={() => {return this.refs.time2}}
                value={sToMoment(this.state.end)}
                onChange={this.updateEnd}
                hideDisabledOptions={true}
                showSecond={false}
                disabledHours={this.getDisabledHoursEnd}
                disabledMinutes={this.getDisabledMinutesEnd}
                />
                <div ref="time2" />
            </Col>
          </FormGroup>

          <FormGroup>
            <Col componentClass={ControlLabel} xs={4}>
              {this.props.t('program:labels.mode.title')}
            </Col>
            <Col xs={8}>
              {['full', 'sidebar', 'panel'].map((mode) => {
                return (
                  <Radio name='mode'
                    onChange={this.handleMode}
                    checked={this.state.mode == mode}
                    value={mode}>
                    {this.props.t('program:labels.mode.' + mode)}
                  </Radio>
                )
              })}
            </Col>
          </FormGroup>

          {(this.state.mode == 'sidebar' || this.state.mode == 'panel') &&
          <FormGroup
              validationState={includes(this.state.errors, 'sidebar') && 'error'}>
            <Col componentClass={ControlLabel} xs={4}>
              {this.props.t('program:labels.sidebarurl')}
            </Col>
            <Col xs={8}>
              <FormControl type='text'
                value={this.state.sidebar}
                name='sidebar'
                onChange={this.handleUrl} />
            </Col>
          </FormGroup>
          }
          {this.state.mode == 'panel' &&
          <FormGroup
              validationState={includes(this.state.errors, 'panel') && 'error'}>
            <Col componentClass={ControlLabel} xs={4}>
              {this.props.t('program:labels.panelurl')}
            </Col>
            <Col xs={8}>
              <FormControl type='text'
                value={this.state.panel}
                name='panel'
                onChange={this.handleUrl} />
            </Col>
          </FormGroup>
          }

        </Form>
    </Panel>
  </Popover>
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

    var over = this.props.range[0] >= 86400 || this.props.range[1] > 86400
    var classes = classNames('list-group-item',
                             'item',
                             {'over': over,
                             'dirty': this.props.moving})

    if (!over) {
      style.backgroundColor = UuidToRgba(this.props.playlist.uuid)
    }

    if (this.props.moving) {
      style.backgroundColor = '#eee'
    }

    var overIcon = over && <Icon pf='warning-triangle-o'/>

    let res = (
      <div className={classes} style={style}>
        <OverlayTrigger
          rootClose
          placement="bottom"
          trigger="click"
          overlay={this.getEdit()}
          ref="edit">
          <div>
            <span className="time">{overIcon} {from} - {to}</span>
            {this.props.playlist.name}
          </div>
        </OverlayTrigger>
      </div>
    )

    return this.props.connectDropTarget(this.props.connectDragSource(res))
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

)(translate(['common', 'program'])(ItemComponent))


