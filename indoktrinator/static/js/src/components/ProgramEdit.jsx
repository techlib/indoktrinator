import * as React from 'react'
import * as Reflux from 'reflux'
import {ProgramActions, PlaylistActions, FeedbackActions} from '../actions'
import {ProgramStore} from '../stores/Program'
import {PlaylistStore} from '../stores/Playlist'
import {hashHistory as BrowserHistory} from 'react-router'
import {confirmModal} from './ModalConfirmMixin'
import {DragDropContext} from 'react-dnd'
import HTML5Backend from 'react-dnd-html5-backend'
import {translate} from 'react-i18next'
import {Column} from './ProgramCreator/Column'
import {Playlist} from './ProgramCreator/Playlist'
import {Col, Row, Grid} from 'react-bootstrap'
import {ListGroup, ListGroupItem} from 'react-bootstrap'
import {AutoAffix} from 'react-overlays'
import * as _ from 'lodash'
import {Message} from './Message'
import {Spinner} from './Spinner'

var Component = React.createClass({

  mixins: [
    Reflux.connect(ProgramStore, 'program'),
    Reflux.connect(PlaylistStore, 'playlist')
  ],

  componentDidMount() {
    ProgramActions.read.triggerAsync(this.props.params.uuid)
      .done(() => {this.setState({programLoaded: true})})
    PlaylistActions.list.triggerAsync()
      .done(() => {this.setState({playlistsLoaded: true})})
  },

  getInitialState() {
    return {
      program: {program: {segments: []}},
      playlist: {list: []},
      columnsOver: _.range(0,7).map(() => false),
      playlistsLoaded: false,
      programLoaded: false
    }
  },

  getData() {
		var segments = []
    _.each(this.state.program.program.segments, (item, index) => {
      segments = segments.concat(this.refs['column-' + index]
                                 .getWrappedInstance().getData())
    })

    var r =  {
      uuid: this.state.program.program.uuid,
			segments: segments
    }
    return r

  },

  handleOver(day, val) {
    var cols = this.state.columnsOver
    cols[day] = val
    this.setState({
      columnsOver: cols
    })
  },

  save() {
    var data = this.getData()
    ProgramActions.update.triggerAsync(this.state.program.program.uuid, data)
    .then(() => {
      this.props.parentReload()
      FeedbackActions.set('success', this.props.t('program:alerts.update'))
    })
  },

  saveName(name) {
    let r = ProgramActions.update.triggerAsync(this.state.program.program.uuid,
      {name: name})

    r.then(() => {
      FeedbackActions.set('success', this.props.t('common:alerts.namechanged'))
      ProgramActions.read(this.props.params.uuid)
    })

    return r
  },


  handleDelete(uuid) {
    confirmModal(
      this.props.t('common:confirm.areyousure'),
      this.props.t('program:confirm.delete', {name: this.state.program.program})
    ).then(() => {
      ProgramActions.delete.triggerAsync(uuid)
      .then(() => {
        BrowserHistory.push('/program/')
        FeedbackActions.set('success', this.props.t('program:alerts.delete'))
      })
    })
  },

  cleanupDrag(ignoreColumn) {
    _.each(this.state.program.program.segments, (item, index) => {
      if (index != ignoreColumn) {
        this.refs['column-' + index].getWrappedInstance().cleanupDrag()
      }
    })
  },

  finishDrop() {
    _.each(this.state.program.program.segments, (item, index) => {
      this.refs['column-' + index].getWrappedInstance().drop()
    })
  },

  render() {
    var overWarning = _.includes(this.state.columnsOver, true) && (
      <Row>
        <Col xs={12}>
          <Message type='warning' message={this.props.t('program:alerts.over')} />
        </Col>
      </Row>
    )

    return (
      <div>
        {overWarning}
      <Row>
        <Grid fluid>
          <Col md={10}>
            <Row className='program'>
              {this.state.programLoaded &&
                this.state.program.program.segments.map((item, index) => {
                  return <Column segments={item}
                                 key={index}
                                 ref={'column-' + index}
                                 cleanup={this.cleanupDrag}
                                 finishDrop={this.finishDrop}
                                 handleOver={this.handleOver}
                                 day={index} />
              })}
              {!this.state.programLoaded && <Spinner lg />}
            </Row>
          </Col>
          <Col md={2}>
            <AutoAffix>
              <ListGroup  className='scrollable-playlists'>
                <ListGroupItem>
                  <h4 className="list-group-item-heading">
                    {this.props.t('program:availableplaylists')}
                  </h4>
                </ListGroupItem>
              {this.state.playlistsLoaded && this.state.playlist.list.map((item) => {
                return <Playlist name={item.name}
                  cleanup={this.cleanupDrag}
                  duration={item.duration}
                  uuid={item.uuid} />
              })}
              {!this.state.playlistsLoaded && <Spinner lg />}
            </ListGroup>
          </AutoAffix>
        </Col>
      </Grid>
    </Row>
    </div>
    )
  }
})

export var ProgramEdit = translate(['program', 'common'], {withRef: true})(
    DragDropContext(HTML5Backend)(Component)
)

