import * as React from "react";
import * as Reflux from "reflux";
import {FeedbackActions, EventActions, SegmentActions} from "../actions";
import {Feedback} from "./Feedback";
import {ProgramStore} from "../stores/Program";
import {SegmentStore} from "../stores/Segment";
import {EventStore} from "../stores/Event";
import {Input, Modal, Button} from "react-bootstrap";
import {FormattedMessage} from "react-intl";
import {SaveButton} from "./form/button/SaveButton";
import {DeleteButton} from "./form/button/DeleteButton";
import BigCalendar from "react-big-calendar";
import moment from "moment";
import {guid} from "../util/database";
import {BootstrapSelect} from "./Select";
import {Tabs, Tab} from "react-bootstrap-tabs";
import {confirmModal} from "./ModalConfirmMixin";

let Header = Modal.Header;
let Body = Modal.Body;
let Footer = Modal.Footer;

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
      'events': [],
      'calendarClickedEvent': {item: {playlist: '', uuid: ''}},
      'calendarClickedEventPlaylist': ''
    }
  },

  componentWillReceiveProps(p) {
    this.setState({
      'title': p.title,
      'name': p.program.name,
      'uuid': p.program.uuid,
      'state': p.program.state,
      'segment': p.segment,
      'event': p.event,
      'events': this.getEvents(p.segment, p.event, new Date())
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

  showNewCalendarItemModal() {
    this.setState({showNewCalendarItemModal: true});
  },

  hideNewCalendarItemModal() {
    this.setState({showNewCalendarItemModal: false});
  },

  showEditCalendarItemModal() {
    this.setState({showEditCalendarItemModal: true});
  },

  hideEditCalendarItemModal() {
    this.setState({showEditCalendarItemModal: false});
  },

  handleSelectSlot(slotInfo) {
    var startDayMidnight = moment(slotInfo.start).startOf('day');
    var start = moment(slotInfo.start);
    var end = moment(slotInfo.end);

    this.setState({
      range: [start.diff(startDayMidnight, 'seconds'), end.diff(startDayMidnight, 'seconds')],
      day: start.weekday(),
      date: start.format('YYYY-MM-DD')
    });

    this.showNewCalendarItemModal();
  },

  handleSelectEvent(event) {
    this.setState({
      calendarClickedEvent: event,
      calendarClickedEventPlaylist: event.item.name
    });

    this.showEditCalendarItemModal();
  },

  validateEvent() {
    var r = [];

    if (!this.state.playlist) {
      r.push(`Playlist is required`)
    }

    if (!this.state.date) {
      r.push(`Date is required`)
    }

    if (!this.state.range) {
      r.push(`Range is required`)
    }

    return r
  },

  validateSegment() {
    var r = [];

    if (!this.state.playlist) {
      r.push(`Playlist is required`)
    }

    // todo: validate day

    if (!this.state.range) {
      r.push(`Range is required`)
    }

    return r;
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
      event.range = this.state.range;

      EventActions.create(event, () => {
        this.hideNewCalendarItemModal();
        EventActions.list(() => {
          var data = EventStore.data.list;
          this.setState({event: data});
          this.setState({
            'events': this.getEvents()
          })
        })
      })
    }
  },

  saveSegment() {
    var errors = this.validateSegment();

    if (errors.length > 0) {
      FeedbackActions.set('error', 'Form contains invalid data:', errors)
    } else {
      var segment = {};
      segment.uuid = guid();
      segment.program = this.state.uuid;
      segment.playlist = this.state.playlist;

      segment.day = this.state.day;
      segment.range = this.state.range;

      SegmentActions.create(segment, () => {
        this.hideNewCalendarItemModal();
        SegmentActions.list(() => {
          var data = SegmentStore.data.list;
          this.setState({segment: data});
          this.setState({
            'events': this.getEvents()
          })
        })
      })
    }
  },

  saveCalendarEvent() {
    if (this.state.calendarClickedEvent.type == 'segment') {
      var segment = this.state.calendarClickedEvent.item;
      segment.playlist = this.state.calendarClickedEventPlaylist;
      SegmentActions.update(segment, () => {
        this.hideEditCalendarItemModal();
        var data = SegmentStore.data.list;
        this.setState({segment: data});
        this.setState({
          'events': this.getEvents()
        })
      })
    } else if (this.state.calendarClickedEvent.type == 'event') {
      var event = this.state.calendarClickedEvent.item;
      event.playlist = this.state.calendarClickedEventPlaylist;
      EventActions.update(event, () => {
        this.hideEditCalendarItemModal();
        var data = EventStore.data.list;
        this.setState({event: data});
        this.setState({
          'events': this.getEvents()
        })
      })
    }
  },

  deleteCalendarEvent() {
    if (this.state.calendarClickedEvent.type == 'segment') {
      confirmModal(
        'Are you sure?',
        'Would you like to remove segment?'
      ).then(() => {
        var segment = this.state.calendarClickedEvent.item;
        SegmentActions.delete(segment.uuid, () => {
          this.hideEditCalendarItemModal();
          SegmentActions.list(() => {
            var data = SegmentStore.data.list;
            this.setState({segment: data});
            this.setState({
              'events': this.getEvents()
            })
          })
        })
      })
    } else if (this.state.calendarClickedEvent.type == 'event') {
      confirmModal(
        'Are you sure?',
        'Would you like to remove event?'
      ).then(() => {
        var event = this.state.calendarClickedEvent.item;
        EventActions.delete(event.uuid, () => {
          this.hideEditCalendarItemModal();
          EventActions.list(() => {
            var data = EventStore.data.list;
            this.setState({event: data});
            this.setState({
              'events': this.getEvents()
            })
          })
        })
      })
    }
  },

  getEvents(segment, event, startDatetime) {
    var events = [];

    if (!segment) {
      segment = this.state.segment;
    }

    if (!event) {
      event = this.state.event;
    }

    if (!startDatetime) {
      startDatetime = new Date();
    }

    segment.forEach((item) => {
      var startMoment = moment(startDatetime).startOf('isoWeek').add(item.day, 'days').seconds(item.range[0]);
      var endMoment = moment(startDatetime).startOf('isoWeek').add(item.day, 'days').seconds(item.range[1]);

      events.push({
        'title': item._playlist.name,
        'start': startMoment.toDate(),
        'end': endMoment.toDate(),
        'type': 'segment',
        'item': item
      })
    });

    event.forEach((item) => {
      var startMoment = moment(item.date, "YYYY-MM-DD").startOf('day').seconds(item.range[0]);
      var endMoment = moment(item.date, "YYYY-MM-DD").startOf('day').seconds(item.range[1]);

      events.push({
        'title': item._playlist.name,
        'start': startMoment.toDate(),
        'end': endMoment.toDate(),
        'type': 'event',
        'item': item
      })
    });

    return events;
  },

  onNavigate(date) {
    this.setState({
      'events': this.getEvents(null, null, date)
    })
  },

  columnStyleGetter: function (event, start, end, isSelected) {
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

  render() {
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
                    { this.state.state == 'Loaded' ? <DeleteButton
                      id={this.state.uuid}
                      handler={this.delete}
                    /> : null }
                  </div>
                </div>
              </div>
            </div>
            { this.props.program.state == 'Loaded' ? <div className='panel panel-default'>
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
                        events={this.state.events}
                        eventPropGetter={this.columnStyleGetter}
                        onNavigate={this.onNavigate}
                        timeslots={1}
                        defaultView='week'
                        defaultDate={new Date(moment().startOf('isoWeek').format("YYYY, MM, DD"))}
                        onSelectEvent={this.handleSelectEvent}
                        onSelectSlot={this.handleSelectSlot}
                      />
                    </div>
                    <Modal
                      show={this.state.showEditCalendarItemModal}
                      onHide={this.hideEditCalendarItemModal}
                      dialogClassName="edit-calendar-item-modal"
                    >
                      <Modal.Body>
                        <p>
                          <BootstrapSelect
                            label='Playlist'
                            ref='playlist'
                            name='playlist'
                            onChange={this.handleChange}
                            data-live-search={true}
                            value={this.state.calendarClickedEventPlaylist}
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
                          handler={this.saveCalendarEvent}
                        />
                        <DeleteButton
                          id={this.state.calendarClickedEvent.item.uuid}
                          handler={this.deleteCalendarEvent}
                        />
                        <Button
                          onClick={this.hideEditCalendarItemModal}
                        >Close</Button>
                      </Modal.Footer>

                    </Modal>
                    <Modal
                      show={this.state.showNewCalendarItemModal}
                      onHide={this.hideNewCalendarItemModal}
                      dialogClassName="new-calendar-item-modal"
                    >
                      <Tabs>
                        <Tab label={
                          <FormattedMessage
                            id="app.menu.segment.title"
                            description="Title"
                            defaultMessage="Segment"
                          />}>
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
                              onClick={this.hideNewCalendarItemModal}
                            >Close</Button>
                          </Modal.Footer>
                        </Tab>
                        <Tab label={<FormattedMessage
                          id="app.menu.event.title"
                          description="Title"
                          defaultMessage="Event"
                        />}>
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
                              onClick={this.hideNewCalendarItemModal}
                            >Close</Button>
                          </Modal.Footer>
                        </Tab>
                      </Tabs>
                    </Modal>
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
