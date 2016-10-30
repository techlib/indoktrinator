import * as React from "react";
import * as Reflux from "reflux";
import {FeedbackActions, EventActions, ProgramActions, PlaylistActions, SegmentActions} from "../actions";
import {Feedback} from "./Feedback";
import {EventStore} from "../stores/Event";
import {SegmentStore} from "../stores/Segment";
import {ProgramStore} from "../stores/Program";
import {PlaylistStore} from "../stores/Playlist";
import {notEmpty} from "../util/simple-validators";
import {Input, Modal, Button} from "react-bootstrap";
import {FormattedMessage} from "react-intl";
import {SaveButton} from "./form/button/SaveButton";
import {DeleteButton} from "./form/button/DeleteButton";
import BigCalendar from "react-big-calendar";
import moment from "moment";
import {guid} from "../util/database";
import {BootstrapSelect} from "./Select";
import {Tabs, Tab} from "react-bootstrap-tabs";

let Header = Modal.Header
let Body = Modal.Body
let Footer = Modal.Footer

BigCalendar.setLocalizer(
  BigCalendar.momentLocalizer(moment)
);

export var Program = React.createClass({

  mixins: [
    Reflux.connect(ProgramStore, 'program')
  ],

  commonProps: {
    labelClassName: 'col-xs-2',
    wrapperClassName: 'col-xs-10',
  },

  getInitialState() {
    return {
      'uuid': this.props.program.uuid,
      'state': this.props.program.state,
      'title': this.props.title,
      'range': [],
      'day': '',
      'date': '',
      'playlist': '',
      'events': this.getEvents()
    }
  },

  componentWillReceiveProps(p) {
    this.setState({
      'title': p.title,
      'name': p.program.name,
      'uuid': p.program.uuid,
      'state': p.program.state
    });
  },

  validate() {
    var r = []

    if (!this.state.name) {
      r.push(`Name is required`)
    }

    if (!this.state.uuid) {
      r.push(`Uuid is required`)
    }

    return r
  },

  handleChange(evt) {
    this.setState({[evt.target.name]: evt.target.value})
  },

  handleChangeNewEventModal(evt) {
    this.setState({[evt.target.name]: evt.target.value})
  },

  save() {
    var errors = this.validate();

    if (errors.length > 0) {
      FeedbackActions.set('error', 'Form contains invalid data:', errors)
    } else {
      this.props.saveHandler(this.state)
    }
  },

  delete() {
    this.props.deleteHandler(this.state.uuid);
  },

  showModal() {
    this.setState({show: true});
  },

  hideModal() {
    this.setState({show: false});
  },

  handleSelectSlot(slotInfo) {
    var startDayMidnight = moment(slotInfo.start.toLocaleString(), "DD/MM/YYYY, HH:mm:ss A").startOf('day');
    var start = moment(slotInfo.start.toLocaleString(), "DD/MM/YYYY, HH:mm:ss A");
    var end = moment(slotInfo.end.toLocaleString(), "DD/MM/YYYY, HH:mm:ss A");

    this.setState({
      range: [start.diff(startDayMidnight, 'seconds'), end.diff(startDayMidnight, 'seconds')],
      day: start.format("E"),
      date: moment(slotInfo.start.toLocaleString(), "DD/MM/YYYY, HH:mm:ss A").format('YYYY-MM-DD')
    });

    this.showModal();
  },

  validateEvent() {
    var r = []

    if (!this.state.playlist) {
      r.push(`Playlist is required`)
    }

    if (!this.state.day) {
      r.push(`Day is required`)
    }

    if (!this.state.range) {
      r.push(`Range is required`)
    }

    return r
  },

  saveSegment() {
    var errors = this.validateEvent();

    if (errors.length > 0) {
      FeedbackActions.set('error', 'Form contains invalid data:', errors)
    } else {
      var segment = {};
      segment.uuid = guid();
      segment.program = this.state.uuid;
      segment.playlist = this.state.playlist;

      segment.day = this.state.day;
      segment.range = this.state.range;
      console.log(segment);
      //console.log(this.state);
      SegmentActions.create(segment);

      this.hideModal();
    }
  },

  saveEvent() {
    var errors = this.validateEvent();

    if (errors.length > 0) {
      FeedbackActions.set('error', 'Form contains invalid data:', errors)
    } else {
      var event = {};
      event.uuid = guid();
      event.program = this.state.uuid;
      event.playlist = this.state.playlist;
      event.date = this.state.date;
      event.range = this.range;

      console.log(event);
      //console.log(this.state);
      EventActions.create(event);

      this.hideModal();
    }
  },

  getEvents() {
    console.log(this.props.segment);
    /*this.props.segment.forEach(function (item) {
     //console.log(index);
     this.state.events.push({
     'title': item._playlist.name,
     'start': moment("2016-10-30").startOf('day').seconds(item.range[0]).format("DD/MM/YYYY, HH:mm:ss A"), // FIXME start the specific day by property day
     'end': moment("2016-10-30").startOf('day').seconds(item.range[1]).format("DD/MM/YYYY, HH:mm:ss A")
     });
     }.bind(this));

     this.props.event.forEach(function (item) {
     this.state.events.push({
     'title': item._playlist.name,
     'start': moment(item.date, "YYYY-MM-DD").startOf('day').seconds(item.range[0]).format("DD/MM/YYYY, HH:mm:ss A"),
     'end': moment(item.date, "YYYY-MM-DD").startOf('day').seconds(item.range[1]).format("DD/MM/YYYY, HH:mm:ss A")
     });
     }.bind(this));*/

    return [
      {
        'title': 'All Day Event',
        'start': new Date(2016, 10, 30),
        'end': new Date(2016, 10, 30)
      },
      {
        'title': 'Long Event',
        'start': new Date(2016, 10, 30),
        'end': new Date(2016, 10, 30)
      }
    ]
  },

  render() {
    //console.log(this.state);

    return (
      <div className='col-xs-24 container-fluid'>
        <h1>{this.state.title}</h1>
        <Feedback />
        <div className='row'>
          <div className='col-xs-24 col-md-12'>
            <div className='panel panel-default'>
              <div className='panel-heading'>
                <FormattedMessage
                  id="app.menu.program.title"
                  description="Title"
                  defaultMessage="Program"
                />
              </div>
              <div className='panel-body'>
                <div className="form-horizontal">
                  <Input
                    type="text"
                    label="Name"
                    ref="name"
                    name="name"
                    onChange={this.handleChange}
                    value={this.state.name}
                    {...this.commonProps} />
                  <div className="form-group">
                    <label className="control-label col-xs-2">
                      <FormattedMessage
                        id="app.menu.program.timetable.title"
                        description="Title"
                        defaultMessage="Time table"
                      />
                    </label>
                    <div className="col-xs-10">
                      <BigCalendar
                        selectable
                        events={this.state.events}
                        timeslots={1}
                        defaultView='week'
                        defaultDate={moment().utc().valueOf()}
                        onSelectEvent={event => alert(event.title)}
                        onSelectSlot={this.handleSelectSlot}
                      />
                    </div>
                    <Modal
                      show={this.state.show}
                      onHide={this.hideModal}
                      dialogClassName="event-modal"
                    >

                      <Tabs onSelect={(index, label) => console.log(label + ' selected')}>
                        <Tab label={<FormattedMessage
                          id="app.menu.segment.title"
                          description="Title"
                          defaultMessage="Segment"
                        />}>

                          <Modal.Header closeButton>
                            <Modal.Title id="contained-modal-title-lg">Modal heading</Modal.Title>
                          </Modal.Header>
                          <Modal.Body>

                            <p>
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
                            </p>
                          </Modal.Body>
                          <Modal.Footer>
                            <SaveButton
                              handler={this.saveSegment}
                            />
                            <Button
                              onClick={this.hideModal}
                            >Close</Button>
                          </Modal.Footer>
                        </Tab>
                        <Tab label={<FormattedMessage
                          id="app.menu.event.title"
                          description="Title"
                          defaultMessage="Event"
                        />}>

                          <Modal.Header closeButton>
                            <Modal.Title id="contained-modal-title-lg">Modal heading</Modal.Title>
                          </Modal.Header>
                          <Modal.Body>

                            <p>
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
                            </p>
                          </Modal.Body>
                          <Modal.Footer>
                            <SaveButton
                              handler={this.saveEvent}
                            />
                            <Button
                              onClick={this.hideModal}
                            >Close</Button>
                          </Modal.Footer>
                        </Tab>
                      </Tabs>
                    </Modal>
                  </div>
                </div>
                <div className='panel-footer'>
                  <div className="row">
                    <div className="col-xs-6">
                      <SaveButton
                        handler={this.save}
                      />
                    </div>
                    <div className="col-xs-6">
                      { this.state.state == 'Loaded' ? <DeleteButton
                        id={this.state.uuid}
                        handler={this.delete}
                      /> : null }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
});