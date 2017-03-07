import * as React from 'react'
import * as Reflux from 'reflux'
import {Feedback} from './Feedback'
import {ProgramActions as pa, FeedbackActions, DeviceActions} from '../actions'
import {OverlayTrigger, Tooltip, Grid, Row, Col, ListGroup} from 'react-bootstrap'
import {Link} from 'react-router'
import {ProgramStore} from '../stores/Program'
import {DeviceStore} from '../stores/Device'
import {confirmModal} from './ModalConfirmMixin'
import {translate} from 'react-i18next'
import {Icon} from './Icon'
import {filter} from 'lodash'
import moment from 'moment'

var ListViewItem = translate(['program', 'common'])(React.createClass({

  handleDeleteProgram() {
    confirmModal(
      this.props.t('confirm.areyousure'),
      this.props.t('program:confirm.delete', {name: this.props.name}),
      {confirmLabel: this.props.t('program:confirm.deletebutton')}
    ).then(() => {
      pa.delete(this.props.uuid)
      .then(() => {
        pa.list()
        FeedbackActions.set('success', this.props.t('program:alerts.delete'))
      })
    })
  },

  render() {
    const {t} = this.props
    var upcomingEvents = filter(this.props.events, (item) => {
      return moment(item.date).add(item.range[0], 'seconds').isAfter(moment.now())
    })

    var tooltip = (
      <Tooltip>
        {this.props.devices.map((device) => {
          return <span>{device.name}<br/></span>
        })}
      </Tooltip>)

    return (
      <div className="list-group-item">
        <div className="list-view-pf-actions">
          <button className="btn btn-default" onClick={this.handleDeleteProgram}>
            <Icon pf='delete' /> {t('program:buttons.delete')}</button>
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
                <Icon fa='calendar-plus-o' />
                <Link to={`/program/${this.props.uuid}/event`}>
                <strong>{upcomingEvents.length}</strong> {t('program:events', {count: upcomingEvents.length})}
                </Link>
              </div>
              <div className="list-view-pf-additional-info-item">
                <Icon fa='television' />
                <OverlayTrigger overlay={tooltip}>
                  <div>
                    <strong>{this.props.devices.length}</strong> {t('program:devicecount', {count: this.props.devices.length})}
                  </div>
                </OverlayTrigger>
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
    Reflux.connect(ProgramStore, 'program'),
    Reflux.connect(DeviceStore, 'device')
  ],

  componentDidMount() {
    pa.list()
    DeviceActions.list()
  },

  getInitialState() {
    return {program: {list: []}, device: {list: []}}
  },

  getDevices(program) {
    return filter(this.state.device.list, ['program', program])
  },

	getBlank() {
		return (
			<div className="blank-slate-pf">
				<h1>{this.props.t('program:list.blank')}</h1>
				<div className="blank-slate-pf-main-action">
          <a className='btn btn-success btn-lg' href='#/program/new'>
						<Icon fa="plus" /> {this.props.t('program:buttons.create')}
					</a>
				</div>
			</div>
		)
	},

  render() {
    var programCount = this.state.program.list.length

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
            {programCount > 0 &&
              <ListGroup className='list-view-pf list-view-pf-view'>
                {this.state.program.list.map((item) => {
                  return <ListViewItem
                            key={item.uuid}
                            devices={this.getDevices(item.uuid)}
                            {...item} />
                  }
                )}
              </ListGroup>
            }
            {programCount == 0 && this.getBlank()}
          </Col>
        </Row>
      </Grid>
    )
  }
}))

