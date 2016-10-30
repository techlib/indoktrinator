import * as React from "react";
import * as Reflux from "reflux";
import {Program} from "./Program";
import {ProgramActions, PlaylistActions, SegmentActions, EventActions} from "../actions";
import {ProgramStore} from "../stores/Program";
import {PlaylistStore} from "../stores/Playlist";
import {SegmentStore} from "../stores/Segment";
import {hashHistory as BrowserHistory} from "react-router";

export var ProgramEdit = React.createClass({
  mixins: [
    Reflux.connect(ProgramStore, 'program'),
    Reflux.connect(PlaylistStore, 'playlist'),
    Reflux.connect(SegmentStore, 'segment')
  ],

  componentDidMount() {
    ProgramActions.read(this.props.params.uuid)
    SegmentActions.list()
    EventActions.list()
    PlaylistActions.list()
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
    ProgramActions.update(data)
    this.state.program.program = data
    BrowserHistory.push('/program/' + data.uuid);
  },

  handleDelete(uuid) {
    ProgramActions.delete(uuid)
    BrowserHistory.push('/program/');
  },

  getFilteredSegments() {
    return this.state.segment.list.filter(function (item) {
      return item.program == this.state.program.program.uuid;
    }.bind(this))
  },

  getFilteredSegments() {
    return this.state.event.list.filter(function (item) {
      return item.program == this.state.program.program.uuid;
    }.bind(this))
  },

  render() {
    return (
      <Program
        title={this.state.program.program.name}
        segment={this.getFilteredSegments()}
        program={this.state.program.program}
        playlist={this.state.playlist.list}
        event={this.state.event.list}
        saveHandler={this.handleSave}
        deleteHandler={this.handleDelete}
      />);
  }
})

