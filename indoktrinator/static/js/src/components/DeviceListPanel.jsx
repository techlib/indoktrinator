import * as React from 'react'
import {Link} from 'react-router'
import {FormattedMessage} from 'react-intl'

export var DeviceListPanel = React.createClass({
  render() {
    var onlineIcon = this.props.online ? 'pficon-ok' : 'pficon-error-circle-o'

    return (
      <div className="col-xs-12 col-md-3 col-lg-3">
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
            {this.props.program ?
              <Link to={`/program/${this.props.program}`}>
                {this.props._program.name}
              </Link>
            : '- no program selected -'}
          </div>
        </div>
      </div>
    )
  }
})
