import * as React from "react"
import {Tabs, Tab} from "react-bootstrap-tabs"
import {StoreTypes} from "../../stores/StoreTypes"
import {FormattedMessage} from "react-intl"
import moment from "moment"
import {guid} from "../../util/database"
import {Modal} from "react-bootstrap"
import {SegmentEdit} from "./SegmentEdit"
import {EventEdit} from "./EventEdit"

export var CreateCalendarEventModal = React.createClass({

  commonProps: {
    labelClassName: 'col-xs-2',
    wrapperClassName: 'col-xs-10',
  },

  getInitialState() {
    return {
      'tabPanelIndex': 0
    }
  },

  createEvent(slotInfo) {
    var event = {}
    event.uuid = guid()
    event.program = this.props.program.uuid
    event.state = StoreTypes.NEW

    if (slotInfo) {
      var startDayMidnight = moment(slotInfo.start).startOf('day')
      var start = moment(slotInfo.start)
      var end = moment(slotInfo.end)

      event.range = [start.diff(startDayMidnight, 'seconds'), end.diff(startDayMidnight, 'seconds')]
      event.date = start.format('YYYY-MM-DD')
    } else {
      event.range = [0, 0]
      event.date = moment().format('YYYY-MM-DD')
    }

    return event
  },

  createSegment(slotInfo) {
    var segment = {}
    segment.uuid = guid()
    segment.program = this.props.program.uuid
    segment.state = StoreTypes.NEW

    if (slotInfo) {
      var startDayMidnight = moment(slotInfo.start).startOf('day')
      var start = moment(slotInfo.start)
      var end = moment(slotInfo.end)

      segment.range = [start.diff(startDayMidnight, 'seconds'), end.diff(startDayMidnight, 'seconds')]
      segment.day = start.isoWeekday()
    } else {
      var midnight = moment().startOf('day')
      var now = moment()

      segment.day = now.isoWeekday()
      segment.range = [now.diff(midnight, 'seconds'), now.diff(midnight, 'seconds')]
    }

    return segment
  },

  handleSelectTabPanel(index) {
    this.setState({tabPanelIndex: index})
  },

  hide() {
    this.props.hideHandler()
  },

  saveSegment(segment) {
    this.props.saveSegmentHandler(segment)
  },

  saveEvent(event) {
    this.props.saveEventHandler(event)
  },

  render() {
    return (
      <Modal
        show={this.props.show}
        onHide={this.hide}
        dialogClassName="new-calendar-item-modal"
      >
        <Tabs
          selected={this.state.tabPanelIndex}
          onSelect={this.handleSelectTabPanel}
        >
          <Tab label={
            <FormattedMessage
              id="app.menu.segment.title"
              description="Title"
              defaultMessage="Segment"
            />}>
            <SegmentEdit
              segment={this.createSegment(this.props.slotInfo)}
              playlist={this.props.playlist}
              saveHandler={this.saveSegment}
              hideHandler={this.hide}
            />
          </Tab>
          <Tab label={<FormattedMessage
            id="app.menu.event.title"
            description="Title"
            defaultMessage="Event"
          />}>
            <EventEdit
              event={this.createEvent(this.props.slotInfo)}
              playlist={this.props.playlist}
              saveHandler={this.saveEvent}
              hideHandler={this.hide}
            />
          </Tab>
        </Tabs>
      </Modal>
    )
  }
})
