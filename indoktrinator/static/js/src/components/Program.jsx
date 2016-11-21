import * as React from "react";
import * as Reflux from "reflux";
import {FeedbackActions, EventActions, SegmentActions} from "../actions";
import {ProgramStore} from "../stores/Program";
import {SegmentStore} from "../stores/Segment";
import {Feedback} from "./Feedback";
import {EventStore} from "../stores/Event";
import {FormattedMessage} from "react-intl";
import {DeleteButton} from "./form/button/DeleteButton";
import BigCalendar from "react-big-calendar";
import {SaveButton} from "./form/button/SaveButton";
import moment from "moment";
import {SegmentEditModal} from "./Program/SegmentEditModal";
import {EventEditModal} from "./Program/EventEditModal";
import {CreateCalendarEventModal} from "./Program/CreateCalendarEventModal";
import {StoreTypes} from "./../stores/StoreTypes";
import {guid} from "../util/database";
import {Tabs, Tab} from "react-bootstrap-tabs";
import {confirmModal} from "./ModalConfirmMixin";
import {Input} from "react-bootstrap";

BigCalendar.setLocalizer(
  BigCalendar.momentLocalizer(moment)
);

moment.locale('cz', {
  week: {
    dow: 1, // Monday is the first day of the week.
    doy: 4  // The week that contains Jan 4th is the first week of the year.
  }
});

moment.locale('en', {
  week: {
    dow: 1, // Monday is the first day of the week.
    doy: 4  // The week that contains Jan 4th is the first week of the year.
  }
});

export var Program = React.createClass({

  mixins: [
    Reflux.connect(ProgramStore, 'program'),
    Reflux.connect(EventStore, 'event'),
    Reflux.connect(SegmentStore, 'segment')
  ],

  commonProps: {
    labelClassName: 'col-xs-2',
    wrapperClassName: 'col-xs-10',
  },

  getInitialState() {
    return {
      'uuid': this.props.program.uuid,
      'title': this.props.title,
      'event': {list: []},
      'segment': {list: []},
      'bigCalendarSlotInfo': {}, // clicked slot info
      'bigCalendarDate': new Date(moment().startOf('isoWeek').format("YYYY, MM, DD")), // actual start calendar date
      'showSegmentEditModal': false,
      'showEventEditModal': false,
      'showCreateCalendarModal': false
    }
  },

  componentWillReceiveProps(p) {
    this.setState({
      'title': p.title,
      'name': p.program.name,
      'uuid': p.program.uuid,
      'state': p.program.state,
      'segment': {list: p.segment},
      'event': {list: p.event}
    });
  },

  createEvent(slotInfo) {
    var startDayMidnight = slotInfo ? moment(slotInfo.start).startOf('day') : moment().startOf('day');

    var event = {};
    event.uuid = guid();
    event.program = this.props.program;
    event.state = StoreTypes.NEW;

    if (slotInfo) {
      var start = moment(slotInfo.start);
      var end = moment(slotInfo.end);

      event.range = [start.diff(startDayMidnight, 'seconds'), end.diff(startDayMidnight, 'seconds')];
      event.date = start.format('YYYY-MM-DD');
    } else {
      var now = moment();

      event.range = [now.diff(startDayMidnight, 'seconds'), now.diff(startDayMidnight, 'seconds')];
      event.date = now.format('YYYY-MM-DD');
    }

    return event;
  },

  createSegment(slotInfo) {
    var startDayMidnight = slotInfo ? moment(slotInfo.start).startOf('day') : moment().startOf('day');

    var segment = {};
    segment.uuid = guid();
    segment.program = this.props.program;
    segment.state = StoreTypes.NEW;

    if (slotInfo) {
      var start = moment(slotInfo.start);
      var end = moment(slotInfo.end);

      segment.range = [start.diff(startDayMidnight, 'seconds'), end.diff(startDayMidnight, 'seconds')];
      segment.day = start.weekday();
    } else {
      var now = moment();

      segment.day = now.weekday();
      segment.range = [now.diff(startDayMidnight, 'seconds'), now.diff(startDayMidnight, 'seconds')];
    }

    return segment;
  },

  deleteEvent(uuid) {
    confirmModal(
      'Are you sure?',
      'Would you like to remove event?'
    ).then(() => {
      EventActions.delete(uuid, () => {
        this.hideEventEditModal();
        this.reloadEventsSources();
      });
    });
  },

  deleteSegment(uuid) {
    confirmModal(
      'Are you sure?',
      'Would you like to remove segment?'
    ).then(() => {
      SegmentActions.delete(uuid, () => {
        this.hideSegmentEditModal();
        this.reloadEventsSources();
      });
    });
  },

  updateEvent(event) {
    EventActions.update(event, () => {
      this.hideEventEditModal();
      this.reloadEventsSources();
    });
  },

  updateSegment(segment) {
    SegmentActions.update(segment, () => {
      this.hideSegmentEditModal();
      this.reloadEventsSources();
    });
  },

  saveEvent(event) {
    EventActions.create(event, () => {
      this.hideCreateCalendarEventModal();
      this.reloadEventsSources();
    });
  },

  saveSegment(segment) {
    SegmentActions.create(segment, () => {
      this.hideCreateCalendarEventModal();
      this.reloadEventsSources();
    });
  },

  validate() {
    var r = [];

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

  save() {
    var errors = this.validate();

    if (errors.length > 0) {
      FeedbackActions.set('error', 'Form contains invalid data:', errors)
    } else {

      // save only name
      var program = {};
      program.name = this.state.name;
      program.uuid = this.state.uuid;
      program.state = this.state.state;
      program.title = this.state.title;

      this.props.saveHandler(program);
    }
  },

  delete() {
    this.props.deleteHandler(this.state.uuid);
  },

  showEventEditModal() {
    this.setState({showEventEditModal: true});
  },

  hideEventEditModal() {
    this.setState({showEventEditModal: false});
  },

  showSegmentEditModal() {
    this.setState({showSegmentEditModal: true});
  },

  hideSegmentEditModal() {
    this.setState({showSegmentEditModal: false});
  },

  showCreateCalendarEventModal() {
    this.setState({showCreateCalendarEventModal: true});
  },

  hideCreateCalendarEventModal() {
    this.setState({showCreateCalendarEventModal: false});
  },

  handleSelectSlot(slotInfo) {
    this.setState({
      bigCalendarSlotInfo: slotInfo
    });
    this.showCreateCalendarEventModal();
  },

  handleSelectEvent(event)
  {
    if (event.type == 'event') {
      EventActions.read(event.uuid, () => {
        this.setState({
          selectedEvent: EventStore.data.event
        });
        this.showEventEditModal();
      });
    } else if (event.type == 'segment') {
      SegmentActions.read(event.uuid, () => {
        this.setState({
          selectedSegment: SegmentStore.data.segment
        });
        this.showSegmentEditModal();
      });
    }
  },

  reloadEventsSources() {
    SegmentActions.list(() => {
      var data = SegmentStore.data.list;
      this.setState({segment: {list: this.getFilteredSegments(data)}});
    });
    EventActions.list(() => {
      var data = EventStore.data.list;
      this.setState({event: {list: this.getFilteredSegments(data)}});
    });
  },

  getFilteredSegments(segments) {
    return segments.filter((item) => {
      return item.program == this.props.params.uuid;
    });
  },

  getFilteredEvents(events) {
    return events.filter((item) => {
      return item.program == this.props.params.uuid;
    });
  },

  getPreparedEvents()
  {
    var events = [];

    this.state.segment.list.forEach((item) => {

      // +1 / -1 because  + 1, // cus bug of bigCalendar, events immediately behind yourselfs
      var startMoment = moment(this.state.bigCalendarDate).startOf('week').add(item.day, 'days').seconds(item.range[0] + 1);
      var endMoment = moment(this.state.bigCalendarDate).startOf('week').add(item.day, 'days').seconds(item.range[1] - 1);

      events.push({
        'title': item._playlist.name,
        'start': startMoment.toDate(),
        'end': endMoment.toDate(),
        'type': 'segment',
        'uuid': item.uuid
      });
    });

    // +1 / -1 because  + 1, // cus bug of bigCalendar, events immediately behind yourselfs
    this.state.event.list.forEach((item) => {
      var startMoment = moment(item.date, "YYYY-MM-DD").startOf('day').seconds(item.range[0] + 1);
      var endMoment = moment(item.date, "YYYY-MM-DD").startOf('day').seconds(item.range[1] - 1);

      events.push({
        'title': item._playlist.name,
        'start': startMoment.toDate(),
        'end': endMoment.toDate(),
        'type': 'event',
        'uuid': item.uuid
      });
    });

    return events;
  },

  onNavigate(date)
  {
    this.setState({
      'bigCalendarDate': date
    });
  },

  columnStyleGetter: function (event) {
    var style = {
      borderRadius: '0px',
      opacity: 0.8,
      color: 'black',
      border: '0px',
      display: 'block'
    };

    if (event.type == 'segment') {
      style = {
        backgroundColor: '#0CB3EB'
      }
    } else {
      style = {
        backgroundColor: '#D62439'
      };
    }
    return {
      style: style
    }
  },

  render()
  {
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
                    { this.state.state == StoreTypes.LOADED ? <DeleteButton
                      id={this.state.uuid}
                      handler={this.delete}
                    /> : null }
                  </div>
                </div>
              </div>
            </div>
            { this.props.program.state == StoreTypes.LOADED ? <div className='panel panel-default'>
              <div className='panel-body'>
                <div className="form-horizontal">

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
                        startAccessor='start'
                        endAccessor='end'
                        events={this.getPreparedEvents()}
                        eventPropGetter={this.columnStyleGetter}
                        onNavigate={this.onNavigate}
                        timeslots={1}
                        defaultView='week'
                        defaultDate={this.state.bigCalendarDate}
                        onSelectEvent={this.handleSelectEvent}
                        onSelectSlot={this.handleSelectSlot}
                        views={['day', 'week']}
                      />
                    </div>
                    <CreateCalendarEventModal
                      title='Create event or segment'
                      show={this.state.showCreateCalendarEventModal}
                      program={this.props.program}
                      playlist={this.props.playlist}
                      slotInfo={this.state.bigCalendarSlotInfo}
                      saveEventHandler={this.saveEvent}
                      deleteEventHandler={this.deleteEvent}
                      saveSegmentHandler={this.saveSegment}
                      deleteSegmentHandler={this.deleteSegment}
                      hideHandler={this.hideCreateCalendarEventModal}
                    />
                    <EventEditModal
                      title={this.state.selectedEvent && this.state.selectedEvent.state == StoreTypes.LOADED ? this.state.selectedEvent.playlist.name : 'New Event'}
                      show={this.state.showEventEditModal}
                      event={this.state.selectedEvent ? this.state.selectedEvent : this.createEvent()}
                      playlist={this.props.playlist}
                      saveHandler={this.updateEvent}
                      deleteHandler={this.deleteEvent}
                      hideHandler={this.hideEventEditModal}
                    />
                    <SegmentEditModal
                      title={this.state.selectedSegment && this.state.selectedSegment.state == StoreTypes.LOADED ? this.state.selectedSegment.playlist.name : 'New Segment'}
                      show={this.state.showSegmentEditModal}
                      segment={this.state.selectedSegment ? this.state.selectedSegment : this.createSegment()}
                      playlist={this.props.playlist}
                      saveHandler={this.updateSegment}
                      deleteHandler={this.deleteSegment}
                      hideHandler={this.hideSegmentEditModal}
                    />
                  </div>
                </div>
              </div>
            </div> : null }
          </div>
        </div>
      </div>
    )
  }
});
