import * as React from 'react'
import {EventActions, FeedbackActions} from '../actions'
import {confirmModal} from './ModalConfirmMixin'
import {translate} from 'react-i18next'
import {Col, Row, ListGroup} from 'react-bootstrap'
import {ProgramEventItem} from './ProgramEventItem'
import {Icon} from './Icon'
import {Spinner} from './Spinner'

var Component = React.createClass({

  handleDelete(uuid, name, date) {
    confirmModal(
      this.props.t('common:confirm.areyousure'),
      this.props.t('program:confirm.deleteevent', {name: name, date: date}),
      {confirmLabel: this.props.t('event:buttons.confirmdelete')}
    ).then(() => {
      EventActions.delete.triggerAsync(uuid)
      .then(() => {
        this.props.parentReload()
        FeedbackActions.set('success', this.props.t('program:alerts.delete'))
      })
    })
  },

  getBlank() {
    return (
      <div className="blank-slate-pf">
        <h1>{this.props.t('event:list.blank')}</h1>
        <div className="blank-slate-pf-main-action">
          <a className='btn btn-success btn-lg' href={`#/program/${this.props.params.uuid}/event/new`}>
            <Icon fa="plus" /> {this.props.t('program:buttons.createevent')}
          </a>
        </div>
      </div>
    )
  },

  render() {
    var programCount = this.props.program.events.length

    return (
      <Row className="program">
        <Col md={12}>
          {(this.props.programLoaded && programCount > 0) &&
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
          }
          {(this.props.programLoaded && programCount == 0) && this.getBlank()}
          {!this.props.programLoaded && <Spinner lg />}
        </Col>
      </Row>
      )
  }
})

export var ProgramEventList = translate(['event', 'common'])(Component)

