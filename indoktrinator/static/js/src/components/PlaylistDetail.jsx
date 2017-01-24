import * as React from 'react'
import moment from 'moment'

export var PlaylistDetail = React.createClass({

  render() {
    return (
      <div className='col-xs-12 container-fluid'>
        <h1>{this.props.name}</h1>

        <div className="list-group list-view-pf list-view-pf-view playlist">

          {this.props.items.map((item) => {
            return (
								<div className="list-group-item">
									<div className="list-view-pf-main-info">
										<div className="list-view-pf-left">
											<img src={item._file.preview} width="80" height="45"
													 alt="placeholder image"/>
										</div>
										<div className="list-view-pf-body">
											<div className="list-view-pf-description">
												<div className="list-group-item-heading">
													{item._file.path}
												</div>
											</div>
											<div className="list-view-pf-additional-info">
													<i className="fa fa-clock-o"> </i> {moment.duration(item._file.duration, 'seconds').format('mm:ss', {trim: false})}
											</div>
										</div>
									</div>
								</div>
						)
          })}
        </div>
      </div>
    )
  }
})
