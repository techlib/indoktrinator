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
import {InlineNameEdit} from './InlineNameEdit'
import {Feedback} from './Feedback'
import {Col, Row, Grid} from 'react-bootstrap'
import {ListGroup, ListGroupItem} from 'react-bootstrap'

var Component = React.createClass({

  mixins: [
    Reflux.connect(ProgramStore, 'program'),
    Reflux.connect(PlaylistStore, 'playlist')
  ],

  componentDidMount() {
    ProgramActions.read(this.props.params.uuid)
    PlaylistActions.list()
  },

  getInitialState() {
    return {
      program: {program: {segments: []}},
      playlist: {list: []},
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
        this.refs['column-' + index].getWrappedInstance().cleanupDrag();
      }
    })
  },

  render() {
    return (
        <Row>
          <Grid fluid>
          <Col md={10}>
            <Row className='program'>
              {this.state.program.program.segments.map((item, index) => {
                  return <Column segments={item}
                                 key={index}
                                 ref={'column-' + index}
                                 cleanup={this.cleanupDrag}
                                 day={index} />
                })}
            </Row>
          </Col>

          <Col md={2}>
            <ListGroup>
              <ListGroupItem>
                <h4 className="list-group-item-heading">
                  {this.props.t('program:availableplaylists')}
                </h4>
              </ListGroupItem>
            {this.state.playlist.list.map((item, index) => {
              return <Playlist name={item.name}
                duration={item.duration}
                uuid={item.uuid} />
            })}
          </ListGroup>
        </Col>
      </Grid>
        </Row>
    )
  }
})

export var ProgramEdit = translate(['program', 'common'], {withRef: true})(
    DragDropContext(HTML5Backend)(Component)
)

