import * as React from "react";
import * as Reflux from "reflux";
import {PlaylistCreator} from "./PlaylistCreator";
import {PlaylistDetail} from "./PlaylistDetail";
import {PlaylistActions, FileActions} from "../actions";
import {PlaylistStore} from "../stores/Playlist";
import {FileStore} from "../stores/File";
import {StoreTypes} from "./../stores/StoreTypes";
import {Types} from "./PlaylistCreator/Types";
import {v4 as uuid} from 'uuid';

export function getItems(playlist) {
  if (!playlist.items || playlist.items.length === 0) {
    return [];
  }

  const items = [];
  playlist.items.forEach((item, index) => {
    items.push({
      index: index,
      uuid: item.uuid,
      type: Types.SYNTH_ITEM,
      state: StoreTypes.LOADED,
      file: {
        name: item.file_name,
        token: item.file_token,
        duration: item.file_duration,
        path: item.file_path,
        preview: item.file_preview,
        type: item.file_type,
        uuid: item.file_uuid
      },
      hide: false,
      editable: !playlist.system,
      reactKey: uuid(),
    });
  });

  return items;
};

export var PlaylistEdit = React.createClass({

  mixins: [
    Reflux.connect(PlaylistStore, 'playlist'),
    Reflux.connect(FileStore, 'file')
  ],

  getInitialState() {
    return {loaded: false}
  },

  componentDidMount() {
    PlaylistActions.read(this.props.params.uuid, () => this.setState({loaded: true}));
    FileActions.list();
    PlaylistActions.list();
  },

  getInitialState() {
    return {
      playlist: {list: [], playlist: {}},
      file: {list: []}
    }
  },

  render() {
    if (!this.state.loaded){
      return <div>Loading...</div>;
    }

    return <div>{this.state.playlist.playlist.system ?
       <PlaylistDetail
         uuid={this.state.playlist.playlist.uuid}
       />
     : <PlaylistCreator
       playlist={this.state.playlist}
       files={this.state.file.list}
       title={this.state.playlist.playlist.name}
       items={getItems(this.state.playlist.playlist)}
     />}</div>
  }
})
