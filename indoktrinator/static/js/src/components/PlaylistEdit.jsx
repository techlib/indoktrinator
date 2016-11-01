import * as React from "react";
import * as Reflux from "reflux";
import {PlaylistCreator} from "./PlaylistCreator";
import {PlaylistActions, FileActions} from "../actions";
import {PlaylistStore} from "../stores/Playlist";
import {FileStore} from "../stores/File";

export var PlaylistEdit = React.createClass({

  mixins: [
    Reflux.connect(PlaylistStore, 'playlist'),
    Reflux.connect(FileStore, 'file')
  ],

  componentDidMount() {
    PlaylistActions.read(this.props.params.uuid);
    PlaylistActions.list();
    FileActions.list();
  },

  getInitialState() {
    return {
      playlist: { list: [], playlist: {}},
      file: {list: []}
    }
  },

  render() {
    return (
      <PlaylistCreator
        playlist={this.state.playlist}
        file={this.state.file.list}
        title={this.state.playlist.playlist.name}
      />);
  }
})