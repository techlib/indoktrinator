import * as React from 'react'
import {translate} from 'react-i18next'
import moment from 'moment'
import {SplitButton, MenuItem, ListGroupItem} from 'react-bootstrap'
import {hashHistory as BrowserHistory} from 'react-router'
import {Icon} from './Icon'
import classNames from 'classnames'

export var ProgramEventItem = translate(['event', 'common'])(React.createClass({

	delete() {
    this.props.handleDelete(this.props.uuid,
                            this.props.playlist,
                            moment(this.props.date).format('D. M.'))
	},

	gotoEvent() {
		BrowserHistory.push(`/program/${this.props.program}/event/${this.props.uuid}`)
	},

  render() {

    var now = moment()
    var day = moment(this.props.date)

		var editLink = [<Icon pf='edit' />, ' ', this.props.t('event:buttons.edit')]
    var start = moment().startOf('day').second(this.props.range[0])
    var end = moment().startOf('day').second(this.props.range[1])
    var date = day.format('D. M. YYYY')
    var history = day.isBefore(now, 'day')
    var playing = day.isSame(now, 'day') && now.isBetween(start, end)

    var startStr = start.format('HH:mm')
    var endStr = end.format('HH:mm')

    var cls = classNames({
      'text-muted': history,
      'list-group-item-success': playing
    })

		return (
			<ListGroupItem className={cls}>
				<div className="list-view-pf-actions">
					<SplitButton pullRight={true}
                       bsStyle='default'
                       title={editLink}
                       onClick={this.gotoEvent}>

						<MenuItem onClick={this.delete}>
							<Icon pf='delete' /> {this.props.t('event:buttons.delete')}
						</MenuItem>

					</SplitButton>
				</div>

        <div className="list-view-pf-main-info">
					<div className="list-view-pf-body">
						<div className="list-view-pf-description">
              <div className="list-group-item-heading">
                {date}
              </div>
							<div className="list-group-item-text">
									{this.props.playlist}
							</div>
            </div>
            <div className="list-view-pf-additional-info">
              <div className="list-view-pf-additional-info-item">
                {!playing ? <Icon fa='clock-o' />
                          : <Icon fa='play' />} {startStr} &mdash; {endStr}
              </div>
            </div>
					</div>
        </div>
			</ListGroupItem>
		)
  }
}))
