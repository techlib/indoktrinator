import * as React from 'react'
import {Link} from 'react-router'
import {programSelectionModal} from './ModalProgramSelect'
import {DeviceActions, FeedbackActions} from '../actions'
import {translate} from 'react-i18next'
import {Col, Panel} from 'react-bootstrap'
import {Icon} from './Icon'

export var DeviceListPanel = translate('device')(React.createClass({

  selectProgram() {
    programSelectionModal(
      this.props.program ? this.props._program.uuid : null,
      null,
      this.props.t
    ).then((newProgram) => {
      DeviceActions.update.triggerAsync({id: this.props.id, program: newProgram})
      .then(() => {
        DeviceActions.list()
        FeedbackActions.set('success', this.props.t('device:alerts.programset'))

      })
    })
  },

  render() {
    var on = this.props.online
    const {t} = this.props

    var icon = on ? 'ok' : 'error-circle-o'
    var status = on ? t('device:status.online') : t('device:status.offline')

    var header = (
      <h3>
        <Link to={`/device/${this.props.id}`}>
          {this.props.name}
        </Link>
      </h3>
    )

    var footer = (
      <div>
        <Icon pf={icon} /> {status}

        {this.props.online ? [
          ', ',
          <Icon fa='power-off' />,
          ' ', t('device:status.' + this.props.power)
          ] : null}
        <br/>
        <a onClick={this.selectProgram}>
          {this.props.program ? this.props._program.name : t('device:noprogram')}
        </a>
      </div>
    )

    return (
      <Col xs={12} sm={6} md={4} lg={3}>
        <Panel header={header} footer={footer}>
          <Link to={`/device/${this.props.id}`}>
            <img className="img-responsive"
                 src={`${this.props.photo}?${Date.now()}`}
                 style={{height: 250}}></img>
          </Link>
        </Panel>
      </Col>
    )
  }
}))
