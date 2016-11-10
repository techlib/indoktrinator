import * as React from "react";
import {Tabs, Tab} from "react-bootstrap-tabs";
import {Modal, Button} from "react-bootstrap";
import {FeedbackActions} from "../../actions";
import {BootstrapSelect} from "./../Select";
import {StoreTypes} from "../../stores/StoreTypes";
import {SaveButton} from "../form/button/SaveButton";
import {DeleteButton} from "../form/button/DeleteButton";
import {FormattedMessage} from "react-intl";
import TimePicker from "rc-time-picker";
import moment from "moment";

let Header = Modal.Header;
let Body = Modal.Body;
let Footer = Modal.Footer;

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
    });
  },

  validate() {
    var r = [];

    if (!this.state.playlist) {
      r.push(`Playlist is required`)
    }

    if (this.state.range[0] > this.state.range[1]) {
      r.push(`Format of range required is [x < y]`);
    }

    if (!this.state.date) {
      r.push(`Date is required`)
    }

    return r
  },

  handleChangeStartDate(value) {
    this.setState({
      range: [
        -moment(this.state.date).startOf('day').diff(value, 'seconds'),
        this.state.range[1]
      ]
    });
  },

  handleChangeEndDate(value) {
    this.setState({
      range: [
        this.state.range[0],
        -moment(this.state.date).startOf('day').diff(value, 'seconds')
      ]
    });
  },

  getStartDate() {
    return moment(this.state.date).startOf('day').add(this.state.range[0], 'seconds');
  },

  getEndDate() {
    return moment(this.state.date).startOf('day').add(this.state.range[1], 'seconds');
  },

  handleChange(evt) {
    this.setState({[evt.target.name]: evt.target.value})
  },

  delete() {
    this.props.deleteHandler(this.state.uuid);
  },

  save() {
    var errors = this.validate();

    if (errors.length > 0) {
      FeedbackActions.set('error', 'Form contains invalid data:', errors)
    } else {

      var event = this.props.event;
      event.date = this.state.date;
      event.range = this.state.range;
      event.playlist = this.state.playlist;

      this.props.saveHandler(event);
    }
  },

  hide() {
    this.props.hideHandler();
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
                    id="app.menu.event.range.start"
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
        </Modal.Body>
        <Modal.Footer>
          <SaveButton
            handler={this.save}
          />
          { this.props.event.state == StoreTypes.LOADED ? <DeleteButton
            id={this.props.event.uuid}
            handler={this.delete}
          /> : null }
          <Button
            onClick={this.hide}
          >Close</Button>
        </Modal.Footer>
      </Modal>);
  }
});