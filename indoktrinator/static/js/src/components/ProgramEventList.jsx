import * as React from 'react'
import {EventActions, FeedbackActions} from '../actions'
import {confirmModal} from './ModalConfirmMixin'
import {translate} from 'react-i18next'
import {Col, Row, ListGroup} from 'react-bootstrap'
import {ProgramEventItem} from './ProgramEventItem'

var Component = React.createClass({

  handleDelete(uuid, name, date) {
    confirmModal(
      this.props.t('common:confirm.areyousure'),
      this.props.t('program:confirm.deleteevent', {name: name, date: date}),
      {confirmLabel: this.props.t('event:buttons.confirmdelete')}
    ).then(() => {
      EventActions.delete.triggerAsync(uuid)
      .then(() => {
        this.parentReload()
        FeedbackActions.set('success', this.props.t('program:alerts.delete'))
      })
    })
  },

  render() {
    return (
      <Row className="program">
        <Col md={12}>
          <ListGroup className="list-view-pf list-view-pf-view">
              {this.props.program.events.map((item) => {
                return <ProgramEventItem date={item.date}
                                         range={item.range}
                                         uuid={item.uuid}
                                         program={item.program}
                                         handleDelete={this.handleDelete}
                                         handleSave={this.handleSave}
                                         playlist={item._playlist.name}
                                         playlistUuid={item._playlist.uuid}
                                         playlists={this.props.playlists} />
              })}
          </ListGroup>
        </Col>
      </Row>
      )
  }
})

export var ProgramEventList = translate(['event', 'common'])(Component)

