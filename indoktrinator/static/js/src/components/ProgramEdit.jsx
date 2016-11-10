import * as React from "react";
import * as Reflux from "reflux";
import {Program} from "./Program";
import {ProgramActions, PlaylistActions, SegmentActions, EventActions, FeedbackActions} from "../actions";
import {ProgramStore} from "../stores/Program";
import {PlaylistStore} from "../stores/Playlist";
import {EventStore} from "../stores/Event";
import {SegmentStore} from "../stores/Segment";
import {hashHistory as BrowserHistory} from "react-router";
import {confirmModal} from "./ModalConfirmMixin";

export var ProgramEdit = React.createClass({

  mixins: [
    Reflux.connect(ProgramStore, 'program'),
    Reflux.connect(PlaylistStore, 'playlist'),
    Reflux.connect(SegmentStore, 'segment'),
    Reflux.connect(EventStore, 'event')
  ],

  componentDidMount() {
    ProgramActions.read(this.props.params.uuid);
    SegmentActions.list();
    EventActions.list();
    PlaylistActions.list();
  },

  getInitialState() {
    return {
      program: {program: {}},
      playlist: {list: []},
      segment: {list: []},
      event: {list: []}
    }
  },

  handleSave(data) {
    ProgramActions.update(data, () => {
      this.setState({program: {program: data}});
    })
  },

  handleDelete(uuid) {
    confirmModal(
      'Are you sure?',
      'Would you like to remove program?'
    ).then(() => {
      ProgramActions.delete(uuid, () => {
        BrowserHistory.push('/program/');
        FeedbackActions.set('success', 'Program deleted')
      })
    });
  },

  getFilteredSegments() {
    return this.state.segment.list.filter((item) => {
      return item.program == this.state.program.program.uuid;
    });
  },

  getFilteredEvents() {
    return this.state.event.list.filter((item) => {
      return item.program == this.state.program.program.uuid;
    });
  },

  render() {
    return (
      <Program
        title={this.state.program.program.name}
        segment={this.getFilteredSegments()}
        program={this.state.program.program}
        playlist={this.state.playlist.list}
        event={this.getFilteredEvents()}
        saveHandler={this.handleSave}
        deleteHandler={this.handleDelete}
      />);
  }
});