import * as React from 'react'
import {Link} from 'react-router'

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
					{this.props.id}
				</div>
				<div className="panel-footer">
					Playing: Playlist 1
				</div>
      </div>
			</div>
    )
  }
})
