import * as React from "react";
import {PlaylistActions, ItemActions, FeedbackActions} from "../actions";
import update from "react/lib/update";
import {AutoItem} from "./PlaylistCreator/AutoItem";
import {SyntheticItem} from "./PlaylistCreator/SyntheticItem";
import {DragDropContext} from "react-dnd";
import HTML5Backend from "react-dnd-html5-backend";
import {map, filter} from "lodash";
import {FormattedMessage} from "react-intl";
import {Input} from "react-bootstrap";
import {Feedback} from "./Feedback";
import {hashHistory as BrowserHistory} from "react-router";
import {guid} from "../util/database";

var Component = React.createClass({

  commonProps: {
    labelClassName: 'col-xs-2',
    wrapperClassName: 'col-xs-10',
  },

  componentWillReceiveProps(p) {
    this.setState({
      uuid: p.playlist.playlist.uuid,
      name: p.playlist.playlist.name,
      title: p.playlist.playlist.name,
      playlist: {list: p.playlist.list},
      file: p.file
    });
  },

  getInitialState() {
    return {
      'playlist': {list: []},
      'items': [{uuid: 'default', type: 'video', path: '', editable: false}],
      'newCounter': 0,
      'filter': '',
      'openPlaylist': null,
      'file': []
    }
  },

  moveCard(dragIndex, hoverIndex) {
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
  },

  addToSynth(obj, pos) {
    obj.uuid = '_n-' + this.state.newCounter
    obj.hide = true
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

      // create playlist
      var playlist = {};
      playlist.name = this.state.name;
      playlist.uuid = this.state.uuid;
      PlaylistActions.update(playlist, () => {

        this.setState({name: playlist.name, title: playlist.name});

        // create playlist items
        var ii = 1;
        this.state.items.forEach((item, i) => {
          if (item.uuid != "default") {
            var databaseItem = {};
            databaseItem.playlist = this.state.uuid;
            databaseItem.uuid = guid();
            databaseItem.position = item.position;
            databaseItem.file = item.file;
            databaseItem.duration = item.duration;
            databaseItem.position = ii;

            ItemActions.create(databaseItem);
          }
          ii++;
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


  togglePlaylist(uuid) {
    this.setState(update(this.state, {
      openPlaylist: {
        $set: this.state.openPlaylist != uuid ? uuid : null
      }
    }))
  },

  finalizeDrop() {
    const items = map(this.state.items, (item) => {
      item.hide = false
      item._type = 'synth'
      delete(item.index)
      return item
    })

    this.setState(update(this.state, {
      items: {$set: items}
    }))

  },

  getFilteredAvailableFiles() {
    return filter(this.state.file, (item) => {
      return item.name.toLowerCase().indexOf(this.state.filter.toLowerCase()) >= 0
    })
  },

  getAutoItem(file, index) {
    return <AutoItem
      index={index}
      moveCard={this.moveCard}
      addToSynth={this.addToSynth}
      cancelDrop={this.cancelDrop}
      finalizeDrop={this.finalizeDrop}
      {...file} />
  },

  deleteItemHandler(uuid) {
    ItemActions.delete(uuid, () => {
      BrowserHistory.push('/playlist/' + uuid)
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
                        return <SyntheticItem
                          index={i}
                          key={item.uuid}
                          hide={item.hide}
                          editable={item.editable ? item.editable : true}
                          deleteItemHandler={this.deleteItemHandler}
                          moveCard={this.moveCard}
                          addToSynth={this.addToSynth}
                          {...item} />
                      }
                    )}
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
