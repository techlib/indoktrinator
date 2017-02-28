import * as React from 'react'
import {EventActions, FeedbackActions} from '../actions'
import {hashHistory as BrowserHistory, Link} from 'react-router'
import {translate} from 'react-i18next'
import {Col, Row, Panel} from 'react-bootstrap'
import {EventForm} from './EventForm'
import moment from 'moment'
import {Icon} from './Icon'

export var ProgramEventNew = translate(['event', 'common'])(React.createClass({
	
  save() {
   this.refs.newform.getWrappedInstance().save()
  },

  handleSave(data) {
    EventActions.create.triggerAsync(data).then(() => {
      this.props.parentReload()
      BrowserHistory.push(`/program/${this.props.program.uuid}/event`)
      FeedbackActions.set('success', this.props.t('common:alerts.create'))
    })
	},

  render() {
    if (this.props.playlists.length > 0) {
      var playlist = this.props.playlists[0].uuid
    }

    var footer = (
      <Row>
        <Col xs={6}>
          <Link to={`/program/${this.props.params.uuid}/event`}
                className='btn btn-default'>
                {this.props.t('buttons.cancel')}
          </Link>
        </Col>
        <Col xs={6} className='text-right'>
          <button onClick={this.save} className='btn btn-success'>
            <Icon fa='plus' /> {this.props.t('event:buttons.confirmcreate')}
          </button>
        </Col>
      </Row>
		)

		return (
			<Row>
				<Col xs={12} sm={6} smPush={3}>
					<Panel header={this.props.t('event:titles.newform')}
								 footer={footer}>
            <EventForm
							verifyData={this.props.verifyData}
							handleSave={this.handleSave}
							date={moment().format('YYYY-MM-DD')}
							range={[0,60]}
							playlist={null}
							playlists={this.props.playlists}
							playlistUuid={playlist}
							program={this.props.params.uuid}
              showButton={false}
              ref='newform'
          	/>
					</Panel>
				</Col>
			</Row>
		)
	}
}))


