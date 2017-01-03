import * as React from 'react'
import * as Reflux from 'reflux'
import {PlaylistActions, ItemActions, FeedbackActions, BrowserHistory} from '../actions'
import update from 'react/lib/update'
import {AutoItem} from './PlaylistCreator/AutoItem'
import PlaceholderForInitialDrag, {SyntheticItem}  from './PlaylistCreator/SyntheticItem'
import {DragDropContext} from 'react-dnd'
import HTML5Backend from 'react-dnd-html5-backend'
import {map, filter} from 'lodash'
import {FormattedMessage} from 'react-intl'
import {Input} from 'react-bootstrap'
import {Feedback} from './Feedback'
import {Types} from './PlaylistCreator/Types'
import {PlaylistStore} from '../stores/Playlist'
import {ItemStore} from '../stores/Item'
import {confirmModal} from './ModalConfirmMixin'
import {getItems} from './PlaylistEdit'
import {StoreTypes} from './../stores/StoreTypes'


var Component = React.createClass({

  mixins: [],

  commonProps: {
    labelClassName: 'col-xs-2',
    wrapperClassName: 'col-xs-10',
  },

  componentWillReceiveProps(p) {
    this.setState({
      uuid: p.playlist.playlist.uuid,
      name: p.playlist.playlist.name,
      playlist: {list: p.playlist.list, playlist: {}},
      items: p.items
    })
  },

  getInitialState() {
    return {
      playlist: {list: [], playlist: {}},
      filter: '',
      items: []
    }
  },

  moveItem(dragIndex, hoverIndex) {
    const dragItem = this.state.items[dragIndex]

    this.setState(update(this.state, {
      items: {
        $splice: [
          [dragIndex, 1],
          [hoverIndex, 0, dragItem]
        ]
      }
    }))
  },

  addToSynth(obj, pos) {
    this.setState(update(this.state, {
      items: {$splice: [[pos, 0, obj]]}
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
    var errors = this.validate()

    if (errors.length > 0) {
      FeedbackActions.set('error', 'Form contains invalid data:', errors)
    } else {

      var data = {
        uuid: this.props.playlist.playlist.uuid,
        name: this.state.name,
        items: this.state.items.map(item => {
          return {
            duration: item.file.duration,
            file: item.file.uuid
          }
        })
      }

      PlaylistActions.update.triggerAsync(data)
      .then(() => {

      })
    }
  },

  validate() {
    var r = []
    if (!this.state.name) {r.push('Name is required')}
    return r
  },

  handleFilter(event) {
    this.setState(update(this.state, {
      filter: {
        $set: event.target.value
      }
    }))
  },

  finalizeDrop() {
    var items = map(this.state.items, (item) => {
      item.hide = false
      item._type = 'synth'
      return item
    })

    this.setState(update(this.state, {
      items: {$set: items}
    }))

  },

  getSyntheticItem(item, index) {
    if (item.hasOwnProperty('index')) {
      delete item.index
    }

    return <SyntheticItem
      index={index}
      key={item.uuid}
      hide={item.hide}
      item={item}
      type={Types.SYNTH_ITEM}
      deleteItemHandler={this.deleteItemHandler}
      moveItem={this.moveItem}
      addToSynth={this.addToSynth}
      />
  },

  getAutoItem(file, index) {
    // normalize for <Item>
    var item = {
      uuid: file.uuid,
      file: {
        duration: file.duration,
        name: file.name,
        preview: file.preview,
        uuid: file.uuid
      }
    }

    return <AutoItem
      index={index}
      key={item.uuid}
      item={item}
      type={Types.AUTO_ITEM}
      cancelDrop={this.cancelDrop}
      finalizeDrop={this.finalizeDrop}
    />
  },

  getFilteredAvailableFiles() {
    return filter(this.props.files, (item) => {
      return item.name.toLowerCase().indexOf(this.state.filter.toLowerCase()) >= 0
    })
  },

  reloadItems(playlist) {
    this.setState({items: getItems(playlist)})
  },

  deleteItemHandler(index) {
    this.setState(update(this.state, {
      items: {
        $splice: [[index, 1]]
      }
    }))
  },

  render() {
    return (
      <div className='col-xs-12 container-fluid'>
        <h1>
          {this.state.name}
        </h1>
        <div className='row'>
          <div className='col-xs-12 col-md-6'>
            <Feedback />
            <div className='panel panel-default'>
              <div className='panel-heading'>
                <FormattedMessage
                  id="app.menu.playlist.name"
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
                    {!this.state.items.length && <PlaceholderForInitialDrag addToSynth={this.addToSynth}/>}
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
                    <input onChange={this.handleFilter} type="text" ref="filter"/>
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

export var PlaylistCreator = DragDropContext(HTML5Backend)(Component)
