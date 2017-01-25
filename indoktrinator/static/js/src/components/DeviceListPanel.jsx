import * as React from 'react'
import {Link} from 'react-router'
import {programSelectionModal} from './ModalProgramSelect'
import {DeviceActions, FeedbackActions} from '../actions'
import {translate} from 'react-i18next'

export var DeviceListPanel = translate('device')(React.createClass({

  selectProgram() {
    programSelectionModal(
      this.props.program ? this.props._program.uuid : null
    ).then((newProgram) => {
      DeviceActions.update.triggerAsync({id: this.props.id, program: newProgram})
      .then(() => {
        DeviceActions.list()
        FeedbackActions.set('success', this.props.t('device:alerts.programset'))

      })
    })
  },

  render() {
    var onlineIcon = this.props.online ? 'pficon-ok' : 'pficon-error-circle-o'
    const {t} =this.props

    return (
      <div className="col-xs-12 col-sm-6 col-md-4 col-lg-3">
        <div className="panel panel-default device">
          <div className="panel-heading">
            <h3 className="panel-title">
              <Link to={`/device/${this.props.id}`}>
                {this.props.name}
              </Link>
            </h3>
          </div>
          <div className="panel-body text-center">
            <Link to={`/device/${this.props.id}`}>
              <img className="img-responsive"
                   src={this.props.photo}
                   style={{width: 250, height: 250}}></img>
            </Link>
          </div>
          <div className="panel-footer">
            <span className="pficon" className={onlineIcon}>
            </span> {this.props.online ? t('device:status.online')
                                       : t('device:status.offline')}

            {this.props.online ? [
              ', ',
              <span className="fa fa-power-off"> </span>,
                ' ', t('device:status.' + this.props.power)
            ] : null}
            <br/>
            <a onClick={this.selectProgram}>
              {this.props.program ? this.props._program.name : t('device:noprogram')}
            </a>
          </div>
        </div>
      </div>
    )
  }
}))
