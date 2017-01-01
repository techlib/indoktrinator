import * as React from 'react'
import {Link} from 'react-router'
import {FormattedMessage} from 'react-intl'
import {programSelectionModal} from './ModalProgramSelect'
import {DeviceActions, FeedbackActions} from '../actions'

export var DeviceListPanel = React.createClass({

  selectProgram() {
    programSelectionModal(
      this.props.program ? this.props._program.uuid : null
    ).then((newProgram) => {
      DeviceActions.update.triggerAsync({id: this.props.id, program: newProgram})
      .then(() => {
        DeviceActions.list()
        FeedbackActions.set('success', 'Program set')

      })
    })
  },

  render() {
    var onlineIcon = this.props.online ? 'pficon-ok' : 'pficon-error-circle-o'

    return (
      <div className="col-xs-12 col-sm-6 col-md-4 col-lg-3">
        <div className="panel panel-default">
          <div className="panel-heading">
            <h3 className="panel-title">
              <Link to={`/device/${this.props.id}`}>
                {this.props.name}
              </Link>
            </h3>
          </div>
          <div className="panel-body">
            <Link to={`/device/${this.props.id}`}>
              <img className="img-responsive"
                   src={this.props.photo}
                   style={{width: '100%', height: 250}}></img>
            </Link>
          </div>
          <div className="panel-footer">
            <span className="pficon" className={onlineIcon}>
            </span> <FormattedMessage
              id={'app.menu.device.' + (this.props.online ? 'online' : 'offline')}
              description="Label"
              defaultMessage="Online"
            />
            {this.props.online ? [
              ', ',
              <span className="fa fa-power-off"> </span>,
              ' ',
              <FormattedMessage
                id={'app.menu.device.' + (this.props.power ? 'on' : 'off')}
                defaultMessage="on"
              />]
                : null}
            <br/>
            <a onClick={this.selectProgram}>{this.props.program ?
              this.props._program.name :
              <FormattedMessage
                id="app.menu.device.noprogram"
                defaultMessage="- no program selected -"
              />}</a>
          </div>
        </div>
      </div>
    )
  }
})
