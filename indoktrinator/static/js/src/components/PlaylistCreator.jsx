import * as React from "react";
import * as Reflux from "reflux";
import {PlaylistActions, ItemActions, FeedbackActions, BrowserHistory} from "../actions";
import update from "react/lib/update";
import {AutoItem} from "./PlaylistCreator/AutoItem";
import {SyntheticItem} from "./PlaylistCreator/SyntheticItem";
import {DragDropContext} from "react-dnd";
import HTML5Backend from "react-dnd-html5-backend";
import {map, filter} from "lodash";
import {FormattedMessage} from "react-intl";
import {Input} from "react-bootstrap";
import {Feedback} from "./Feedback";
import {guid} from "../util/database";
import {Types} from "./PlaylistCreator/Types";
import {PlaylistStore} from "../stores/Playlist";
import {ItemStore} from "../stores/Item";
import {FileStore} from "../stores/File";
import {confirmModal} from "./ModalConfirmMixin";
import {StoreTypes} from "./../stores/StoreTypes";

var Component = React.createClass({

  mixins: [
    Reflux.connect(ItemStore, 'item'),
    Reflux.connect(FileStore, 'file')
  ],

  commonProps: {
    labelClassName: 'col-xs-2',
    wrapperClassName: 'col-xs-10',
  },

  componentWillReceiveProps(p) {
    this.setState({
      uuid: p.playlist.playlist.uuid,
      name: p.playlist.playlist.name,
      title: p.playlist.playlist.name,
      playlist: {list: p.playlist.list, playlist: {}},
      files: p.files,
      items: p.items
    });
  },

  getInitialState() {
    return {
      'playlist': {list: []},
      'newCounter': 0,
      'filter': '',
      'openPlaylist': null,
      'file': {file: {}},
      'files': [],
      'items': []
    }
  },

  getItems(playlist) {
    var items = [];

    if (playlist.items && playlist.items.length > 0) {
      playlist.items.forEach((item, index) => {
        items.push({
          uuid: item.uuid,
          index: index,
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
    } else {
      return [{uuid: null, type: Types.DEFAULT, path: '', editable: false, name: 'Drag and drop here!'}];
    }

    return items;
  },

  moveCard(dragIndex, hoverIndex) {
    console.log('2 - drag', dragIndex, 'hover', hoverIndex);

    var test = this.state.items;
    console.log(test);

    const cards = this.state.items;
    const dragCard = cards[dragIndex];

    this.setState(update(this.state, {
      items: {
        $splice: [
          [dragIndex, 1],
          [hoverIndex, 0, dragCard]
        ]
      }
    }));

    var test2 = this.state.items;
    console.log(test2);
  },

  addToSynth(obj, pos) {
    this.setState(update(this.state, {
      items: {$splice: [[pos, 0, obj]]},
      newCounter: {$set: this.state.newCounter + 1}
    }))
  },

  cancelDrop() {
    this.setState(update(this.state, {
      items: {
        $set: this.state.items.filter((item) => {
          return item._type != 'auto'
        })
      }
    }))
  },

  handleChange(evt) {
    this.setState({[evt.target.name]: evt.target.value})
  },

  save() {
    var errors = this.validate();

    if (errors.length > 0) {
      FeedbackActions.set('error', 'Form contains invalid data:', errors)
    } else {

      // clone items
      var itemsCache = this.state.items;

      // delete playlist items
      this.props.playlist.playlist.items.forEach((item) => {
        ItemActions.delete(item.uuid, () => {
        });
      });

      // create playlist items
      var ii = 1;
      itemsCache.forEach((item) => {
        if (item.type != Types.DEFAULT) {
          var databaseItem = {};
          databaseItem.playlist = this.state.uuid;
          databaseItem.file = item.file.uuid;
          databaseItem.duration = item.file.duration;
          databaseItem.position = ii;

          databaseItem.uuid = guid();
          ItemActions.create(databaseItem, () => {

          });

          ii++;
        }
      });
      // update playlist
      var playlist = {};
      playlist.name = this.state.name;
      playlist.uuid = this.state.uuid;
      PlaylistActions.update(playlist, () => {
        // update name + title
        this.setState({name: playlist.name, title: playlist.name});
        // update items
        PlaylistActions.read(this.state.uuid, () => {
          var data = PlaylistStore.data.playlist;
          this.reloadItems(data);
        });
      });
    }
  },

  validate() {
    var r = [];

    if (!this.state.uuid) {
      r.push(`Uuid is required`);
    }

    if (!this.state.name) {
      r.push(`Name is required`);
    }

    return r;
  },

  handleFilter(event) {
    this.setState(update(this.state, {
      filter: {
        $set: event.target.value
      }
    }))
  },

  finalizeDrop() {
    const items = map(this.state.items, (item) => {
      item.hide = false
      item._type = 'synth'
      return item
    });

    this.setState(update(this.state, {
      items: {$set: items}
    }))

  },

  getSyntheticItem(item, index) {
    if (item.hasOwnProperty('index')) {
      delete item.index;
    }
    console.log(index);

    return <SyntheticItem
      index={index}
      key={item.uuid}
      hide={item.hide}
      file={item.file}
      editable={item.editable}
      deleteItemHandler={this.deleteItemHandler}
      cancelItemHandler={this.cancelItemHandler}
      moveCard={this.moveCard}
      addToSynth={this.addToSynth}
      {...item} />
  },

  getFilteredAvailableFiles() {
    return filter(this.state.files, (item) => {
      return item.name.toLowerCase().indexOf(this.state.filter.toLowerCase()) >= 0
    })
  },

  getAutoItem(file, index) {
    return <AutoItem
      index={index}
      file={file}
      moveCard={this.moveCard}
      addToSynth={this.addToSynth}
      cancelDrop={this.cancelDrop}
      finalizeDrop={this.finalizeDrop}
    />
  },

  reloadItems(playlist) {
    this.setState({items: this.getItems(playlist)});
  },

  cancelItemHandler(index) {
    confirmModal(
      'Are you sure?',
      'Would you like to cancel adding of this item?'
    ).then(() => {
      FeedbackActions.set('success', 'Item canceled');

      // remove index
      var items = this.state.items.filter((item, i) => {
        return index != i;
      });

      // remove index
      this.setState(update(this.state, {
        items: {
          $set: items
        }
      }));
    });
  },

  deleteItemHandler(uuid) {
    confirmModal(
      'Are you sure?',
      'Would you like to remove item?'
    ).then(() => {
      ItemActions.delete(uuid, () => {
        FeedbackActions.set('success', 'Item deleted');

        // remove index
        var items = this.state.items.filter((item, i) => {
          return item.uuid != uuid;
        });

        this.setState(update(this.state, {
          items: {
            $set: items
          }
        }));
      });
    });
  },

  render() {
    return (
      <div className='col-xs-12 container-fluid'>
        <h1>
          {this.state.title}
        </h1>
        <div className='row'>
          <div className='col-xs-12 col-md-6'>
            <Feedback />
            <div className='panel panel-default'>
              <div className='panel-heading'>
                <FormattedMessage
                  id="app.menu.playlist.title"
                  description="Title"
                  defaultMessage="Playlist"
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
                  <div className="list-group list-view-pf list-view-pf-view playlist">
                    {this.state.items.map((item, i) => {
                      return (this.getSyntheticItem(item, i))
                    })}
                  </div>
                </div>
              </div>
              <div className='panel-footer'>
                <div className="row">
                  <div className="col-xs-6">
                    <button className='btn btn-primary'
                      onClick={this.save}>
                      <FormattedMessage
                        id="app.buttons.save"
                        description="Save button"
                        defaultMessage="Save"
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className='col-xs-12 col-md-6'>
            <div className='row'>
              <div className='panel panel-default'>
                <div className='panel-heading'>
                  <FormattedMessage
                    id="app.items.title"
                    description="Title"
                    defaultMessage="Items"
                  />
                </div>
                <div className='panel-body'>
                  <div className="form-horizontal">
                    <input onChange={this.handleFilter} type="text" ref="filter"></input>
                    <div className="list-group list-view-pf list-view-pf-view playlist">
                      {this.getFilteredAvailableFiles().map((item, i) => {
                          return (this.getAutoItem(item, i))
                        }
                      )}
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
})

export var PlaylistCreator = DragDropContext(HTML5Backend)(Component);