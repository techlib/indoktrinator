import * as React from 'react'
import {Link} from 'react-router'
import {FormattedMessage} from 'react-intl'

export var DeviceListPanel = React.createClass({
  render() {
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
              <img className="img-responsive" src={this.props.photo} style={{width: '100%', height: 250}}></img>
            </Link>
          </div>
          <div className="panel-footer">
            <ul style={{paddingLeft: 0}}>
              <li style={{display: 'inline', marginRight: 5}}>
                <strong>
                  <FormattedMessage
                    id="app.menu.device.online"
                    description="Label"
                    defaultMessage="Online"
                  />
                </strong>
                : {this.props.online ?
                <FormattedMessage
                  id="app.menu.device.online.true"
                  description="Description"
                  defaultMessage="Yes"
                /> :
                <FormattedMessage
                  id="app.menu.device.online.false"
                  description="Description"
                  defaultMessage="No"
                />},
              </li>
              <li style={{display: 'inline', marginRight: 5}}>
                <strong>
                  <FormattedMessage
                    id="app.menu.device.power"
                    description="Label"
                    defaultMessage="Power"
                  />
                </strong>
                : {this.props.power ?
                <FormattedMessage
                  id="app.menu.device.power.true"
                  description="Description"
                  defaultMessage="Yes"
                /> :
                <FormattedMessage
                  id="app.menu.device.power.false"
                  description="Description"
                  defaultMessage="No"
                />} {this.props.program ? ',' : null}
              </li>
              <li style={{display: 'inline', marginRight: 5}}>
                {this.props.program ?
                  <strong>
                    <Link to={`/program/${this.props.program}`}>
                      {this.props._program.name}
                    </Link>
                  </strong> : null}
              </li>
            </ul>
          </div>
        </div>
      </div>
    )
  }
})
