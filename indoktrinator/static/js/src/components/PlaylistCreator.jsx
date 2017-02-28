import * as React from 'react'
import {PlaylistActions, FeedbackActions} from '../actions'
import update from 'react/lib/update'
import {Item}  from './PlaylistCreator/Item'
import {Placeholder} from './PlaylistCreator/Placeholder'
import {DragDropContext} from 'react-dnd'
import HTML5Backend from 'react-dnd-html5-backend'
import {filter, each} from 'lodash'
import {Feedback} from './Feedback'
import {Types} from './PlaylistCreator/Types'
import {getItems} from './PlaylistEdit'
import {Playlist} from './PlaylistCreator/Playlist'
import {InlineNameEdit} from './InlineNameEdit'
import {translate} from 'react-i18next'
import {Grid, Row, Col, Panel, ListGroup, Button} from 'react-bootstrap'
import {Form, FormGroup, FormControl} from 'react-bootstrap'
import {Icon} from './Icon'

var Component = React.createClass({

  mixins: [],

  componentWillReceiveProps(p) {
    // FIXME - this is a terrible hack and should be done in a more elegant manner
    var newState = {
      uuid: p.playlist.playlist.uuid,
      playlist: {list: p.playlist.list, playlist: p.playlist.playlist},
    }

    if (this.state.items.length == 0) {
      newState['items'] = p.items
    }

    newState['name'] = p.playlist.playlist.name

    this.setState(newState)
  },

  getInitialState() {
    return {
      playlist: {list: [], playlist: {items: []}},
      filter: '',
      name: '',
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
      FeedbackActions.set('error', this.props.t('alerts.invalidform'), errors)
    } else {


      var uuid = this.props.playlist.playlist.uuid
      var data = {
        items: this.state.items.map((item,index) => {
          return {
            duration: item._file.duration,
            file: item._file.uuid,
            position: index
          }
        })
      }

      PlaylistActions.update.triggerAsync(uuid, data)
      .then(() => {
          FeedbackActions.set('success', this.props.t('playlist:alerts.update'))
      })
    }
  },

  validate() {
    var r = []
    if (!this.state.name) {
      r.push(this.props.t('validation.required', {name: 'Name'}))
    }
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
            duration: file._file.duration,
            _file: {
              duration: file._file.duration,
              path: file._file.path,
              uuid: file._file.uuid,
              preview: file._file.preview
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
      file={item._file}
      duration={item.duration}
      deleteItemHandler={this.deleteItemHandler}
      moveItem={this.moveItem}
      addToItems={this.addToItems}
      />
  },

  getAvailablePlaylists() {
    var result = []

    each(this.state.playlist.list, (item) => {

      var items = filter(item.items, (file) => {
        return file._file.path.toLowerCase().indexOf(this.state.filter.toLowerCase()) >= 0
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
    let r = PlaylistActions.update.triggerAsync(this.props.playlist.playlist.uuid,
      {name: name})

    r.then(() => {
      FeedbackActions.set('success', this.props.t('common:alerts.namechanged'))
      PlaylistActions.read(this.props.playlist.playlist.uuid)
    })

    return r
  },

  render() {
    const {t} = this.props

    var footer = (
      <Row>
        <Col xs={6}>
          <Button bsStyle='primary'onClick={this.save}>
            {t('playlist:buttons.save')}
          </Button>
        </Col>
      </Row>
    )

    return (
      <Grid fluid>
        <Row>
          <Col xs={12} sm={6}>
            <InlineNameEdit
              saveAction={this.nameChangeHandler}
              uuid={this.props.playlist.playlist.uuid}
              name={this.state.name}
            />
          </Col>
        </Row>
        <Feedback />
        <Row>
          <Col xs={12} md={6}>
            <Panel header={t('playlist:items')} footer={footer}>
              <ListGroup className='list-view-pf list-view-pf-view playlist'>
                    {this.state.items.map((item, i) => {
                      return (this.getItem(item, i))
                    })}
                    {!this.state.items.length 
                      && <Placeholder addToItems={this.addToItems}/>}
              </ListGroup>
            </Panel>
          </Col>
          <Col xs={12} md={6}>
            <Panel header={t('playlist:availabelitems')}>
              <Form className="search-pf">
                <FormGroup className='has-feedback search-pf-input-group'>
                  <FormControl onChange={this.handleFilter}
                               type="search"
                               placeholder={t('search')} />
                  <Icon glyph='search' className='form-control-feedback' />
                </FormGroup>
              </Form>

              <ListGroup className="list-view-pf list-view-pf-view playlist">
                {this.getAvailablePlaylists()}
              </ListGroup>
            </Panel>
          </Col>
        </Row>
      </Grid>
    )
  }
})

export var PlaylistCreator = translate(['playlist', 'common'])(
  DragDropContext(HTML5Backend)(Component)
)
