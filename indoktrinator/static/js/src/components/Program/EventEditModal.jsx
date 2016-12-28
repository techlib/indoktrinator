import * as React from 'react'
import {Tabs, Tab} from 'react-bootstrap-tabs'
import {Modal, Button} from 'react-bootstrap'
import {FeedbackActions} from '../../actions'
import {BootstrapSelect} from './../Select'
import {StoreTypes} from '../../stores/StoreTypes'
import {SaveButton} from '../form/button/SaveButton'
import {DeleteButton} from '../form/button/DeleteButton'
import {FormattedMessage} from 'react-intl'
import TimePicker from 'rc-time-picker'
import moment from 'moment'
import {getHtmlFormaFromSeconds, html5TimeToSecondsDiff} from './SegmentEditModal'
var DatePicker = require('react-bootstrap-date-picker')

let Header = Modal.Header
let Body = Modal.Body
let Footer = Modal.Footer

export var EventEditModal = React.createClass({

  mixins: [],

  commonProps: {
    labelClassName: 'col-xs-2',
    wrapperClassName: 'col-xs-10',
  },

  getInitialState() {
    return {
      'range': this.props.event.range,
      'date': this.props.event.date
    }
  },

  componentWillReceiveProps(p) {
    this.setState({
      'uuid': p.event.uuid,
      'range': p.event.range,
      'state': p.event.state,
      'date': p.event.date,
      'playlist': p.event.playlist,
      'title': p.event.state == StoreTypes.LOADED ? p.event.playlist.name : 'New Event'
    })
  },

  validate() {
    var r = []

    if (!this.state.playlist) {
      r.push('Playlist is required')
    }

    if (this.state.range[0] > this.state.range[1]) {
      r.push('Format of range required is [x < y]')
    }

    if (!this.state.date) {
      r.push('Date is required')
    }

    return r
  },

  handleChangeStartDate(value) {
    const seconds = value.split(':')
      .reverse()
      .reduce((prev, curr, i, arr) =>
        prev + curr * Math.pow(60, i+(3-arr.length))
        , 0)

    const secondsDiff = moment(this.state.date).startOf('day').add(seconds, 'seconds')

    this.setState({
      range: [
        -moment(this.state.date).startOf('day').diff(secondsDiff, 'seconds'),
        this.state.range[1]
      ]
    })
  },

  handleChangeEndDate(value) {
    const seconds = value.split(':')
      .reverse()
      .reduce((prev, curr, i, arr) =>
        prev + curr * Math.pow(60, i+(3-arr.length))
        , 0)

    const secondsDiff = moment(this.state.date).startOf('day').add(seconds, 'seconds')

    this.setState({
      range: [
        this.state.range[0],
        -moment(this.state.date).startOf('day').diff(secondsDiff, 'seconds')
      ]
    })
  },

  // getStartDate() {
  //   return moment(this.state.date).startOf('day').add(this.state.range[0], 'seconds')
  // },
  //
  // getEndDate() {
  //   return moment(this.state.date).startOf('day').add(this.state.range[1], 'seconds')
  // },

  handleChangeDate(date) {
    // I absolutely don't get it why I have to here increment 1 day here.
    // But I have to. I suppose that's some magic due to broken TimePicker component. :(

    this.setState({date: moment(date).add(1, 'day').toDate()})
  },

  handleChange(evt) {
    this.setState({[evt.target.name]: evt.target.value})
  },

  delete() {
    this.props.deleteHandler(this.state.uuid)
  },

  save() {
    var errors = this.validate()

    if (errors.length > 0) {
      FeedbackActions.set('error', 'Form contains invalid data:', errors)
    } else {

      var event = this.props.event
      event.date = this.state.date
      event.range = this.state.range
      event.playlist = this.state.playlist

      this.props.saveHandler(event)
    }
  },

  hide() {
    this.props.hideHandler()
  },

  render() {
    const {range} = this.state

    return (
      <Modal
        show={this.props.show}
        onHide={this.hide}
        dialogClassName="new-calendar-item-modal"
      >
        <Modal.Body>
          <h2>
            {this.state.title}
          </h2>
          <div className="row">
            <div className="form-group">
              <div className="col-xs-2">
                <label className="control-label">
                  <FormattedMessage
                    id="app.menu.event.date"
                    description="Title"
                    defaultMessage="Date"
                  />
                </label>
              </div>
              <div className="col-xs-10">
                {/*<DatePicker*/}
                  {/*value={this.state.date}*/}
                  {/*onChange={this.handleChangeDate}*/}
                  {/*showClearButton="false"*/}
                {/*/>*/}
                <input type="date"
                       defaultValue={moment(this.state.date).format('YYYY-MM-DD')}
                       onChange={(e) => {this.handleChangeDate(e.target.value)}}
                />
              </div>
            </div>
          </div>
          <div className="row">
            <div className="form-group">
              <div className="col-xs-2">
                <label className="control-label">
                  <FormattedMessage
                    id="app.menu.event.range.start"
                    description="Title"
                    defaultMessage="Start time"
                  />
                </label>
              </div>
              <div className="col-xs-10">
                {/*<TimePicker*/}
                  {/*style={{width: 100}}*/}
                  {/*showSecond={true}*/}
                  {/*defaultValue={this.getStartDate()}*/}
                  {/*onChange={this.handleChangeStartDate}*/}
                {/*/>*/}
                <input type="time" step="1"
                       defaultValue={getHtmlFormaFromSeconds(range[0])}
                       onChange={(e) => {this.handleChangeStartDate(e.target.value)}} />
              </div>
            </div>
          </div>
          <div className="row">
            <div className="form-group">
              <div className="col-xs-2">
                <label className="control-label">
                  <FormattedMessage
                    id="app.menu.segment.range.end"
                    description="Title"
                    defaultMessage="End time"
                  />
                </label>
              </div>
              <div className="col-xs-10">
                {/*<TimePicker*/}
                  {/*style={{width: 100}}*/}
                  {/*showSecond={true}*/}
                  {/*defaultValue={this.getEndDate()}*/}
                  {/*onChange={this.handleChangeEndDate}*/}
                {/*/>*/}
                <input type="time" step="1"
                       defaultValue={getHtmlFormaFromSeconds(range[1])}
                       onChange={(e) => {this.handleChangeEndDate(e.target.value)}} />
              </div>
            </div>
          </div>
          <div className="row">
            <BootstrapSelect
              label='Playlist'
              ref='playlist'
              name='playlist'
              onChange={this.handleChange}
              data-live-search={true}
              value={this.state.playlist}
              {...this.commonProps}>
              {this.props.playlist.map((item) => {
                return <option value={item.uuid} key={item.uuid}>
                  {item.name}</option>
              })}
            </BootstrapSelect>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            onClick={this.hide}
          >Close</Button>

          <SaveButton
            handler={this.save}
          />
          { this.props.event.state == StoreTypes.LOADED ? <DeleteButton
            id={this.props.event.uuid}
            handler={this.delete}
          /> : null }
        </Modal.Footer>
      </Modal>)
  }
})
