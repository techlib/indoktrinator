import * as React from 'react'
import {Tabs, Tab} from 'react-bootstrap-tabs'
import {Modal, Button} from 'react-bootstrap'
import {FeedbackActions} from '../../actions'
import {BootstrapSelect} from '../Select'
import {SaveButton} from '../form/button/SaveButton'
import {DeleteButton} from '../form/button/DeleteButton'
import {StoreTypes} from '../../stores/StoreTypes'
import TimePicker from 'rc-time-picker'
import {FormattedMessage} from 'react-intl'
import moment from 'moment'
import 'rc-time-picker/assets/index.css'
import {Feedback} from '../../stores/Feedback'
import {getHtmlFormaFromSeconds, html5TimeToSecondsDiff} from './SegmentEditModal'

export var SegmentEdit = React.createClass({

  mixins: [],

  commonProps: {
    labelClassName: 'col-xs-3',
    wrapperClassName: 'col-xs-9',
  },

  getInitialState() {
    return {
      'range': this.props.segment.range,
      'day': this.props.segment.day,
      'playlist': this.props.segment.playlist ? this.props.segment.playlist : (this.props.playlist[0] ? this.props.playlist[0].uuid : ''),
      'mode': this.props.segment.mode,
      'sidebar': this.props.segment.sidebar,
      'panel': this.props.segment.panel,
    }
  },

  validate() {
    var r = []

    if (!this.state.playlist) {
      r.push('Playlist is required')
    }

    if (this.state.range[0] > this.state.range[1]) {
      r.push('Format of range is [x < y]')
    }

    if (this.state.range[0] == this.state.range[1]) {
      r.push('Range can not be null')
    }

    return r
  },

  save() {
    var errors = this.validate()

    if (errors.length > 0) {
      FeedbackActions.set('error', 'Form contains invalid data:', errors)
    } else {
      var segment = this.props.segment
      segment.range = this.state.range
      segment.playlist = this.state.playlist

      segment.mode = this.state.mode
      segment.sidebar = this.state.sidebar
      segment.panel = this.state.panel

      this.props.saveHandler(segment)
    }
  },

  delete() {
    this.props.deleteHandler(this.state.uuid)
  },

  hide() {
    this.props.hideHandler()
  },

  handleChangeStartDate(value) {
    const secondsDiff = html5TimeToSecondsDiff(value, this.state.day)
    this.setState({
      range: [
        - moment().startOf('isoWeek').add(this.state.day, 'days').startOf('day').diff(secondsDiff, 'seconds'),
        this.state.range[1]
      ]
    })
  },

  handleChangeEndDate(value) {
    const secondsDiff = html5TimeToSecondsDiff(value, this.state.day)
    this.setState({
      range: [
        this.state.range[0],
        - moment().startOf('isoWeek').startOf('day').add(this.state.day, 'days').diff(secondsDiff, 'seconds')
      ]
    })
  },

  handleChangeMode(evt) {
    this.setState({[evt.target.name]: evt.target.value})
  },

  handleSidebar(value) {
    this.setState({sidebar: value.target.value})
  },

  handlePanel(value) {
    this.setState({panel: value.target.value})
  },

  handleChange(evt) {
    this.setState({[evt.target.name]: evt.target.value})
  },

  render() {
    const {range} = this.state

    return (
      <div>
        <Modal.Body>
          <h2>
            <FormattedMessage
              id="app.menu.event.new"
              description="Title"
              defaultMessage="New Segment"
            />
          </h2>
          <div className="row">
            <div className="form-group">
              <div className="col-xs-3">
                <label className="control-label">
                  <FormattedMessage
                    id="app.menu.segment.range.start"
                    description="Title"
                    defaultMessage="Start time"
                  />
                </label>
              </div>
              <div className="col-xs-9">
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
              <div className="col-xs-3">
                <label className="control-label">
                  <FormattedMessage
                    id="app.menu.segment.range.end"
                    description="Title"
                    defaultMessage="End time"
                  />
                </label>
              </div>
              <div className="col-xs-9">
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

          <div className="row">
            <BootstrapSelect
              label='Layout Mode'
              name='mode'
              ref='mode'
              value={this.state.mode}
              onChange={this.handleChangeMode}
              {...this.commonProps}>

              <option value='full'>Full</option>
              <option value='sidebar'>Sidebar</option>
              <option value='panel'>Sidebar + Panel</option>
            </BootstrapSelect>
          </div>

          <div className="row" style={{display: (this.state.mode == 'sidebar' || this.state.mode == 'panel') ? 'block' : 'none'}}>
            <div className="form-group">
              <div className="col-xs-3">
                <label className="control-label">
                  <FormattedMessage
                    id="app.menu.segment.range.end"
                    description="Sidebar URL"
                    defaultMessage="Sidebar URL"
                  />
                </label>
              </div>
              <div className="col-xs-9">
                <input
                  style={{width: '100%'}}
                  showSecond={true}
                  defaultValue={this.state.sidebar}
                  onChange={this.handleSidebar}
                />
              </div>
            </div>
          </div>

          <div className="row" style={{display: (this.state.mode == 'panel') ? 'block' : 'none'}}>
            <div className="form-group">
              <div className="col-xs-3">
                <label className="control-label">
                  <FormattedMessage
                    id="app.menu.segment.range.end"
                    description="Panel URL"
                    defaultMessage="Panel URL"
                  />
                </label>
              </div>
              <div className="col-xs-9">
                <input
                  style={{width: '100%'}}
                  showSecond={true}
                  defaultValue={this.state.panel}
                  onChange={this.handlePanel}
                />
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          { this.props.segment.state == StoreTypes.LOADED ? <DeleteButton
            id={this.props.segment.uuid}
            handler={this.delete}
          /> : null }
          <Button
            onClick={this.hide}
          >Close</Button>
          <SaveButton
            handler={this.save}
          />

        </Modal.Footer>
      </div>)
  }
})
