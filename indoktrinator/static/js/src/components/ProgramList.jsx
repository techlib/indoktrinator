import * as React from 'react'
import * as Reflux from 'reflux'
import {Feedback} from './Feedback'
import {ProgramActions as pa, FeedbackActions} from '../actions'
import Griddle from 'griddle-react'
import {Pager} from './Pager'
import {Button, Grid, Row, Col, ListGroup} from 'react-bootstrap'
import {Link, hashHistory as BrowserHistory} from 'react-router'
import {regexGridFilter} from '../util/griddle-components'
import {ProgramStore} from '../stores/Program'
import {confirmModal} from './ModalConfirmMixin'
import {translate} from 'react-i18next'
import {Icon} from './Icon'
import {filter} from 'lodash'
import moment from 'moment'

let ProgramLink = React.createClass({
  render() {
    return (<Link to={`/program/${this.props.rowData.uuid}`}>
      {this.props.rowData.name}
    </Link>)
  }
})

let ProgramActions = translate(['program', 'common'])(React.createClass({

  handleDeleteProgram() {
    confirmModal(
      this.props.t('common:confirm.areyousure'),
      this.props.t('program:confirm.delete', {name: this.props.rowData.name})
    ).then(() => {
      pa.delete(this.props.rowData.uuid)
        .then(() => {
          pa.list()
          BrowserHistory.push('/program/')
          FeedbackActions.set('success', this.props.t('program:alerts.delete'))
      })
    })
  },

  render() {
    return (
    <Button
      label=''
      bsStyle=''
      onClick={this.handleDeleteProgram}>
      <Icon fa='trash' /> {this.props.t('program:buttons.delete')}
      </Button>
    )
  }
}))

var ListViewItem = translate(['program', 'common'])(React.createClass({

  handleDeleteProgram() {
    confirmModal(
      this.props.t('confirm.areyousure'),
      this.props.t('program:confirm.delete', {name: this.props.name})
    ).then(() => {
      pa.delete(this.props.uuid)
      .then(() => {
        pa.list()
        FeedbackActions.set('success', this.props.t('program:alerts.delete'))
      })
    })
  },

  render() {
    const {t} =this.props
    var upcomingEvents = filter(this.props.events, (item) => {
                          return moment(item.date).add(item.range[0], 'seconds').isAfter(moment.now())
                         })
    return (
      <div className="list-group-item">
        <div className="list-view-pf-actions">
          <button className="btn btn-default" onClick={this.handleDeleteProgram}>{t('program:buttons.delete')}</button>
        </div>
        <div className="list-view-pf-main-info">
          <div className="list-view-pf-body">
            <div className="list-view-pf-description">
              <div className="list-group-item-heading">
                <Link to={`/program/${this.props.uuid}`}>
                 {this.props.name}
               </Link>
              </div>
            </div>
            <div className="list-view-pf-additional-info">
              <div className="list-view-pf-additional-info-item">
                <Link to={`/program/${this.props.uuid}/event`}>
                <Icon fa='calendar-o' />
                  <strong>{this.props.events.length}</strong>  {t('program:events', {count: this.props.events.length})}
                </Link>
              </div>
              <div className="list-view-pf-additional-info-item">
                <Link to={`/program/${this.props.uuid}/event`}>
                <Icon fa='calendar-plus-o' />
                <strong>{upcomingEvents.length}</strong> {t('program:upcomingevents', {count: upcomingEvents.length})}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}))


export var ProgramList = translate(['program', 'common'])(React.createClass({

  mixins: [
    Reflux.connect(ProgramStore, 'program')
  ],

  componentDidMount() {
    pa.list()
  },

  getInitialState() {
    return {program: {list: []}}
  },

  render() {
    return (
      <Grid fluid>
        <Row>
          <Col xs={12} sm={10} componentClass='h1'>
              {this.props.t('program:list.title')}
          </Col>
          <Col xs={12} sm={2} className='h1 text-right'>
            <a className='btn btn-success' href='#/program/new'>
              <Icon fa='plus' /> {this.props.t('program:buttons.create')}
            </a>
          </Col>
        </Row>
        <Feedback />
        <Row>
         <Col xs={12}>
            <ListGroup className='list-view-pf list-view-pf-view'>
              {this.state.program.list.map(function (item) {
                  return <ListViewItem {...item} key={item.uuid} />
                }
              )}
            </ListGroup>
          </Col>
        </Row>
      </Grid>
    )
  }
}))

