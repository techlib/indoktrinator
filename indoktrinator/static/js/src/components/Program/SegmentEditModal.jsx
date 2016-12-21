import * as React from "react";
import {Tabs, Tab} from "react-bootstrap-tabs";
import {Modal, Button} from "react-bootstrap";
import {FeedbackActions} from "../../actions";
import {BootstrapSelect} from "../Select";
import {SaveButton} from "../form/button/SaveButton";
import {DeleteButton} from "../form/button/DeleteButton";
import {StoreTypes} from "../../stores/StoreTypes";
import {FormattedMessage} from "react-intl";
import TimePicker from "rc-time-picker";
import moment from "moment";

let Header = Modal.Header;
let Body = Modal.Body;
let Footer = Modal.Footer;

export function html5TimeToSecondsDiff(value, day){
  // from hh:mm:ss, hh:mm, hh -> to seconds
  const seconds = value.split(':')
    .reverse()
    .reduce((prev, curr, i, arr) =>
      prev + curr * Math.pow(60, i+(3-arr.length))
      , 0);


  return moment().startOf('isoWeek').add(day, 'days').startOf('day').add(seconds, 'seconds');
}

export function getHtmlFormaFromSeconds(seconds){
  return moment().startOf('isoWeek').startOf('day')
    .seconds(seconds)
    .format('HH:mm:ss');
}

export var SegmentEditModal = React.createClass({

  mixins: [],

  commonProps: {
    labelClassName: 'col-xs-2',
    wrapperClassName: 'col-xs-10',
  },

  getInitialState() {
    return {
      'range': this.props.segment.range,
      'date': this.props.segment.date,
      'mode': this.props.segment.mode,
      'sidebar': this.props.segment.sidebar,
      'panel': this.props.segment.panel,
    }
  },

  componentWillReceiveProps(p) {
    this.setState({
      'uuid': p.segment.uuid,
      'range': p.segment.range,
      'state': p.segment.state,
      'day': p.segment.day,
      'date': p.segment.date,
      'playlist': p.segment.playlist,
      'title': p.segment.state == StoreTypes.LOADED ? p.segment.playlist.name : 'New Segment',
      'mode': p.segment.mode,
      'sidebar': p.segment.sidebar,
      'panel': p.segment.panel,
    });
  },

  validate() {
    var r = [];

    if (!this.state.playlist) {
      r.push(`Playlist is required`)
    }

    if (this.state.range[0] > this.state.range[1]) {
      r.push(`Format of range is [x < y]`);
    }

    if (!this.state.range) {
      r.push(`Range is required`)
    }

    return r;
  },

  save() {
    var errors = this.validate();

    if (errors.length > 0) {
      FeedbackActions.set('error', 'Form contains invalid data:', errors)
    } else {
      var segment = this.props.segment;
      segment.date = this.state.date;
      segment.range = this.state.range;
      segment.playlist = this.state.playlist;
      segment.mode = this.state.mode;
      segment.sidebar = this.state.sidebar;
      segment.panel = this.state.panel;
      segment.day = this.state.day;
      this.props.saveHandler(segment);
    }
  },

  delete() {
    this.props.deleteHandler(this.state.uuid);
  },

  hide() {
    this.props.hideHandler();
  },

  handleChangeStartDate(value) {
    const secondsDiff = html5TimeToSecondsDiff(value, this.state.day);
    this.setState({
      range: [
        -moment().startOf('isoWeek').add(this.state.day, 'days').startOf('day').diff(secondsDiff, 'seconds'),
        this.state.range[1]
      ]
    });
  },

  handleChangeDate({target: {value}}) {
    this.setState({day: +value});
  },

  handleChangeEndDate(value) {
    const secondsDiff = html5TimeToSecondsDiff(value, this.state.day);
    this.setState({
      range: [
        this.state.range[0],
        -moment().startOf('isoWeek').add(this.state.day, 'days').startOf('day').diff(secondsDiff, 'seconds')
      ]
    });
  },

  handleChangeMode(evt) {
    this.setState({[evt.target.name]: evt.target.value});
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
    const {range} = this.state;

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
                <select defaultValue={this.state.day} onChange={this.handleChangeDate}>
                  {/*lame translations by Moment*/}
                  {[1,2,3,4,5,6,0].map((v) =>
                    <option value={v} key={v}>{moment().startOf('isoWeek').add(v - 1, 'days').format('dddd')}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="form-group">
              <div className="col-xs-2">
                <label className="control-label">
                  <FormattedMessage
                    id="app.menu.segment.range.start"
                    description="Title"
                    defaultMessage="Start time"
                  />
                </label>
              </div>
              <div className="col-xs-10">
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
              <div className="col-xs-2">
                <label className="control-label">
                  <FormattedMessage
                    id="app.menu.segment.range.end"
                    description="Sidebar URL"
                    defaultMessage="Sidebar URL"
                  />
                </label>
              </div>
              <div className="col-xs-10">
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
              <div className="col-xs-2">
                <label className="control-label">
                  <FormattedMessage
                    id="app.menu.segment.range.end"
                    description="Panel URL"
                    defaultMessage="Panel URL"
                  />
                </label>
              </div>
              <div className="col-xs-10">
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
      </Modal>);
  }
});
