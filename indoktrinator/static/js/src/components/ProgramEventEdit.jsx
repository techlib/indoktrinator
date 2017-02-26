import * as React from 'react'
import {EventActions, FeedbackActions} from '../actions'
import {hashHistory as BrowserHistory, Link} from 'react-router'
import {translate} from 'react-i18next'
import {Col, Row, Panel} from 'react-bootstrap'
import {EventForm} from './EventForm'
import moment from 'moment'
import {find} from 'lodash'
import {Icon} from './Icon'

export var ProgramEventEdit = translate(['event', 'common'])(React.createClass({

	save() {
		this.refs.form.getWrappedInstance().save()
	},
	
	handleSave(data) {
    EventActions.update.triggerAsync(data.uuid, data).then(() => {
      this.props.parentReload()
      BrowserHistory.push(`/program/${this.props.program.uuid}/event`)
      FeedbackActions.set('success', this.props.t('event:alerts.update'))
    })
	},

  render() {

		var footer = (
      <Row>
        <Col xs={6}>
          <Link to={`/program/${this.props.params.uuid}/event`}
                className='btn btn-default'>
                {this.props.t('buttons.cancel')}
          </Link>
        </Col>
        <Col xs={6} className='text-right'>
          <button onClick={this.save} className='btn btn-primary'>
            <Icon fa='check' /> {this.props.t('event:buttons.confirmedit')}
          </button>
        </Col>
      </Row>
    )


    var event = find(this.props.program.events, (v) => {
      return v.uuid == this.props.params.event
    }) || {_playlist: {}, range: [0, 0], date: new Date()}

    return (
			<Row>
				<Col xs={12} sm={6} smPush={3}>
					<Panel header={this.props.t('program:titles.editevent')}
								 footer={footer}>
						<EventForm
							verifyData={this.props.verifyData}
							handleSave={this.handleSave}
							date={event.date}
							range={event.range}
							playlists={this.props.playlists}
							playlistUuid={event._playlist.uuid}
							program={this.props.params.uuid}
							showButton={false}
							ref='form'
							uuid={event.uuid}
          	/>
					</Panel>
				</Col>
			</Row>
		)
	}
}))


