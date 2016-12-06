import * as React from "react";
import * as Reflux from "reflux";
import {PlaylistCreator} from "./PlaylistCreator";
import {PlaylistDetail} from "./PlaylistDetail";
import {PlaylistActions, FileActions} from "../actions";
import {PlaylistStore} from "../stores/Playlist";
import {FileStore} from "../stores/File";
import {StoreTypes} from "./../stores/StoreTypes";
import {Types} from "./PlaylistCreator/Types";

export var PlaylistEdit = React.createClass({

  mixins: [
    Reflux.connect(PlaylistStore, 'playlist'),
    Reflux.connect(FileStore, 'file')
  ],

  componentDidMount() {
    PlaylistActions.read(this.props.params.uuid);
    FileActions.list();
    PlaylistActions.list();
  },

  getInitialState() {
    return {
      playlist: {list: [], playlist: {}},
      file: {list: []}
    }
  },

  getItems(playlist) {
    var items = [];

    if (playlist.items && playlist.items.length > 0) {
      playlist.items.forEach((item, index) => {
        items.push({
          index: index,
          uuid: item.uuid,
          type: Types.SYNTH_ITEM,
          state: StoreTypes.LOADED,
          file: {
            name: item.file_name,
            hash: item.file_hash,
            duration: item.file_duration,
            path: item.file_path,
            preview: item.file_preview,
            type: item.file_type,
            uuid: item.file_uuid
          },
          hide: false,
          editable: !playlist.system
        });
      });
      return items;
    } else {
      return [{uuid: null, type: Types.DEFAULT, path: '', editable: false, name: 'Drag and drop here!'}];
    }
  },

  render() {
    return <div>{this.state.playlist.playlist.system ?
       <PlaylistDetail
         uuid={this.state.playlist.playlist.uuid}
       />
     : <PlaylistCreator
       playlist={this.state.playlist}
       files={this.state.file.list}
       title={this.state.playlist.playlist.name}
       items={this.getItems(this.state.playlist.playlist)}
     />}</div>
  }
})