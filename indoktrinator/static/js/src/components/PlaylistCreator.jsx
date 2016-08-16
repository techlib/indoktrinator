import * as React from 'react'
import * as Reflux from 'reflux'
import {ModalConfirmMixin} from './ModalConfirmMixin'
import {PlaylistActions} from '../actions'
import {PlaylistStore} from '../stores/Playlist'
import update from 'react/lib/update'

import {AutoItem} from './PlaylistCreator/AutoItem'
import {SyntheticItem} from './PlaylistCreator/SyntheticItem'
import {DragDropContext} from 'react-dnd'
import HTML5Backend from 'react-dnd-html5-backend'
import {map, filter} from 'lodash'

var Component = React.createClass({

  mixins: [//Reflux.listenTo(PlaylistStore, 'playlist'),
           Reflux.listenTo(PlaylistStore, 'onDataChange')
          ],

  onDataChange(data) {
    this.setState(update(this.state, {
      itemsAvailable: {$set: data.list}
    }))
  },

  componentDidMount() {
    //PlaylistActions.read(this.props.params.id)
    PlaylistActions.list()
  },


  moveCard(dragIndex, hoverIndex) {
    const cards  = this.state.items;
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
        $set: this.state.items.filter ((item) => {
        return item._type != 'auto'
      })
    }}))
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

  getFilteredAvailable() {
    return filter(this.state.itemsAvailable, (item) => {
      return  item.name.toLowerCase().indexOf(this.state.filter.toLowerCase()) >= 0
    })
  },

	getAvailableItems(playlist) {
		if (this.state.openPlaylist == playlist.uuid) {
			return playlist.items.map((item, i) => {
				return <AutoItem
						index={i}
						moveCard={this.moveCard}
						addToSynth={this.addToSynth}
						cancelDrop={this.cancelDrop}
						finalizeDrop={this.finalizeDrop}
						{...item} />	

			})
		
		}
	},

  getInitialState() {
    return {'items': [{uuid: '_0', type: 'video', path: ''}],
            'itemsAvailable': [],
            'newCounter': 0,
            'filter': '',
            'openPlaylist': null
            }
  },

  render() {console.log('STATE', this.state)
    return (
      <div className='col-xs-12 container-fluid'>
        <h1>PlaylistCreator</h1>

        <div className='row'>
          <div className='col-xs-12 col-md-6'>
            <h2>Current playlist</h2>
            <div className="list-group list-view-pf list-view-pf-view playlist">
							{this.state.items.map((item, i) => {console.log( item.uuid)
                return <SyntheticItem
                  index={i}
                  key={item.uuid}
                  hide={item.hide}
                  editable={true}
                  moveCard={this.moveCard}
                  addToSynth={this.addToSynth}
                  {...item} />
								}
							)}
            </div>
          </div>

          <div className='col-xs-12 col-md-6'>
            <h2>Available items</h2>
						<input onChange={this.handleFilter} type="text" ref="filter"></input>
            <div className="list-group list-view-pf list-view-pf-view playlist">
              {this.getFilteredAvailable().map((item, i) => {
                return (<div>
                  <h3>
                    <a onClick={this.togglePlaylist.bind(null, item.uuid)}>
                      {item.name}
                    </a>
                  </h3>
									{this.getAvailableItems(item)}
  								</div>)
								}
							)}

            </div>
          </div>
        </div>
      </div>
    )
    }
})

export var PlaylistCreator =  DragDropContext(HTML5Backend)(Component);
