import * as React from 'react'
import * as Reflux from 'reflux'
import {PlaylistActions, ItemActions, FeedbackActions, BrowserHistory} from '../actions'
import update from 'react/lib/update'
import {AutoItem} from './PlaylistCreator/AutoItem'
import {Item}  from './PlaylistCreator/Item'
import {Placeholder} from './PlaylistCreator/Placeholder'
import {DragDropContext} from 'react-dnd'
import HTML5Backend from 'react-dnd-html5-backend'
import {map, filter, each} from 'lodash'
import {FormattedMessage} from 'react-intl'
import {Input} from 'react-bootstrap'
import {Feedback} from './Feedback'
import {Types} from './PlaylistCreator/Types'
import {PlaylistStore} from '../stores/Playlist'
import {ItemStore} from '../stores/Item'
import {confirmModal} from './ModalConfirmMixin'
import {getItems} from './PlaylistEdit'
import {StoreTypes} from './../stores/StoreTypes'
import {Playlist} from './PlaylistCreator/Playlist'
import {NameEdit} from './PlaylistCreator/NameEdit'

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
      playlist: {list: p.playlist.list, playlist: p.playlist.playlist},
      items: p.items,
    })
  },

  getInitialState() {
    return {
      playlist: {list: [], playlist: {items: []}},
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

  addToItems(obj, pos) {
    this.setState(update(this.state, {
      items: {$splice: [[pos, 0, obj]]}
    }))
  },

  appendItem(obj) {
    this.setState(update(this.state, {
      items: {$push: [obj]}
    }), this.finalizeDrop)
  },

  cancelDrop() {
    this.setState(update(this.state, {
      items: {
        $set: this.state.items.filter((item) => {
          return item._type === Types.ITEM
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
    var items = []
		var counter = 0

    each(this.state.items, (item) => {
      item.hide = false
			if (item._type === Types.PLAYLIST_ITEM) {
        item._type = Types.ITEM
        items.push(item)
      } else if (item._type === Types.PLAYLIST) {
        each(item.items, (file) => {
					var res = {
            uuid: item.uuid + counter,
            duration: file.file.duration,
            file: {
						  duration: file.file.duration,
						  path: file.file.path,
						  uuid: file.file.uuid
            },
            hide: false,
            _type: Types.ITEM
					}
          items.push(res)
					counter++
        })
      } else {
				items.push(item)
			}
    })

		this.setState(update(this.state, {
      items: {$set: items}
    }))

  },

  getItem(item, index) {
    if (item.hasOwnProperty('index')) {
      delete item.index
    }

    return <Item
      index={index}
      key={item.uuid}
      hide={item.hide}
      uuid={item.uuid}
      file={item.file}
      duration={item.duration}
      deleteItemHandler={this.deleteItemHandler}
      moveItem={this.moveItem}
      addToItems={this.addToItems}
      />
  },

  getAvailablePlaylists() {
    var result = []

    each(this.state.playlist.list, (item, index) => {

      var items = filter(item.items, (file) => {
        return file.file.path.toLowerCase().indexOf(this.state.filter.toLowerCase()) >= 0
      })

      if (items.length > 0) {
        result.push(<Playlist
                  finalizeDrop={this.finalizeDrop}
                  cancelDrop={this.cancelDrop}
                  addToItems={this.addToItems}
                  appendItem={this.appendItem}
                  name={item.name}
                  items={items}
                  key={item.uuid}
                />)
      }
    })

    return result
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

  nameChangeHandler(name) {
    this.setState({'name': name})
  },

  render() {
    return (
      <div className='col-xs-12 container-fluid'>
        <div className="row">
          <NameEdit
            changeHandler={this.nameChangeHandler}
            name={this.state.name}
          />
        </div>
        <div className='row'>
          <div className='col-xs-12 col-md-6'>
            <Feedback />
            <div className='panel panel-default'>
              <div className='panel-heading'>
                <FormattedMessage
                  id="app.menu.playlist.name"
                  description="Title"
                  defaultMessage="Playlist items"
                />
              </div>

              <div className='panel-body'>
                  <div className="list-group list-view-pf list-view-pf-view playlist">
                    {this.state.items.map((item, i) => {
                      return (this.getItem(item, i))
                    })}
                    {!this.state.items.length && <Placeholder addToItems={this.addToItems}/>}
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
              <div className='panel panel-default'>
                <div className='panel-heading'>
                  <FormattedMessage
                    id="app.items.title"
                    description="Title"
                    defaultMessage="Available items and playlists"
                  />
                </div>
                <div className='panel-body'>

										<form class="search-pf">
											<div className="form-group has-feedback">
												<div className="search-pf-input-group">
													<input onChange={this.handleFilter} type="search" className="form-control" placeholder="Search" ref="filter"/>
 													<span className="glyphicon glyphicon-search form-control-feedback" aria-hidden="true"></span>
												</div>
											</div>
										</form>

                   <div className="list-group list-view-pf list-view-pf-view playlist">
                     {this.getAvailablePlaylists()}
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
