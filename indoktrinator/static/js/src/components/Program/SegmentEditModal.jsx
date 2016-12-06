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
      'resolution': this.props.segment.resolution,
      'url1': this.props.segment.url1,
      'url2': this.props.segment.url2
    }
  },

  componentWillReceiveProps(p) {
    this.setState({
      'uuid': p.segment.uuid,
      'range': p.segment.range,
      'state': p.segment.state,
      'date': p.segment.date,
      'playlist': p.segment.playlist,
      'title': p.segment.state == StoreTypes.LOADED ? p.segment.playlist.name : 'New Segment',
      'resolution': p.segment.resolution,
      'url1': p.segment.url1,
      'url2': p.segment.url2
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
      segment.resolution = this.state.resolution;
      segment.url1 = this.state.url1;
      segment.url2 = this.state.url2;
      this.props.saveHandler(segment);
    }
  },

  delete() {
    this.props.deleteHandler(this.state.uuid);
  },

  hide() {
    this.props.hideHandler();
  },

  getStartDate() {
    return moment().startOf('isoWeek').add(this.state.day, 'days').startOf('day').add(this.state.range[0], 'seconds');
  },

  getEndDate() {
    return moment().startOf('isoWeek').add(this.state.day, 'days').startOf('day').add(this.state.range[1], 'seconds');
  },

  handleChangeStartDate(value) {
    this.setState({
      range: [
        -moment().startOf('isoWeek').add(this.state.day, 'days').startOf('day').diff(value, 'seconds'),
        this.state.range[1]
      ]
    });
  },

  handleChangeEndDate(value) {
    this.setState({
      range: [
        this.state.range[0],
        -moment().startOf('isoWeek').add(this.state.day, 'days').startOf('day').diff(value, 'seconds')
      ]
    });
  },

  handleChangeResolution(evt) {
    this.setState({[evt.target.name]: evt.target.value});
  },

  handleUrl1(value) {
    this.setState({url1: value.target.value})
  },

  handleUrl2(value) {
    this.setState({url2: value.target.value})
  },

  handleChange(evt) {
    this.setState({[evt.target.name]: evt.target.value})
  },

  render() {
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
                    id="app.menu.segment.range.start"
                    description="Title"
                    defaultMessage="Start time"
                  />
                </label>
              </div>
              <div className="col-xs-10">
                <TimePicker
                  style={{width: 100}}
                  showSecond={true}
                  defaultValue={this.getStartDate()}
                  onChange={this.handleChangeStartDate}
                />
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
                <TimePicker
                  style={{width: 100}}
                  showSecond={true}
                  defaultValue={this.getEndDate()}
                  onChange={this.handleChangeEndDate}
                />
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
              label='Resolution'
              name='resolution'
              ref='resolution'
              value={this.state.resolution}
              onChange={this.handleChangeResolution}
              {...this.commonProps}>

              <option value='full'>Full</option>
              <option value='right'>Right</option>
              <option value='both'>Both</option>
            </BootstrapSelect>
          </div>

          <div className="row" style={{display: (this.state.resolution == 'right' || this.state.resolution == 'both') ? 'block' : 'none'}}>
            <div className="form-group">
              <div className="col-xs-2">
                <label className="control-label">
                  <FormattedMessage
                    id="app.menu.segment.range.end"
                    description="Right url"
                    defaultMessage="Right URL"
                  />
                </label>
              </div>
              <div className="col-xs-10">
                <input
                  style={{width: '100%'}}
                  showSecond={true}
                  defaultValue={this.state.url1}
                  onChange={this.handleUrl1}
                />
              </div>
            </div>
          </div>

          <div className="row" style={{display: (this.state.resolution == 'both') ? 'block' : 'none'}}>
            <div className="form-group">
              <div className="col-xs-2">
                <label className="control-label">
                  <FormattedMessage
                    id="app.menu.segment.range.end"
                    description="Bottom url"
                    defaultMessage="Bottom URL"
                  />
                </label>
              </div>
              <div className="col-xs-10">
                <input
                  style={{width: '100%'}}
                  showSecond={true}
                  defaultValue={this.state.url2}
                  onChange={this.handleUrl2}
                />
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <SaveButton
            handler={this.save}
          />
          { this.props.segment.state == StoreTypes.LOADED ? <DeleteButton
            id={this.props.segment.uuid}
            handler={this.delete}
          /> : null }
          <Button
            onClick={this.hide}
          >Close</Button>
        </Modal.Footer>
      </Modal>);
  }
});
