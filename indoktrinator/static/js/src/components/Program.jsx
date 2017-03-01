import * as React from 'react'
import * as Reflux from 'reflux'
import {FeedbackActions, ProgramActions, PlaylistActions} from '../actions'
import {ProgramStore} from '../stores/Program'
import {PlaylistStore} from '../stores/Playlist'
import {Feedback} from './Feedback'
import {Row, Col, Grid} from 'react-bootstrap'
import {InlineNameEdit} from './InlineNameEdit'
import {translate} from 'react-i18next'
import {Link} from 'react-router'
import {Icon} from './Icon'
import {find} from 'lodash'

// ignore unused EventStore - this is needed to instantiate EventStore
// somewhere to listen to EventActions, event though it's not used directly
// eslint-disable-next-line no-unused-vars
import {EventStore} from '../stores/Event'

export var Program = translate(['program', 'common'])(React.createClass({

  mixins: [
    Reflux.connect(ProgramStore, 'program'),
    Reflux.connect(PlaylistStore, 'playlist'),
  ],

  getInitialState() {
    return {
			program: {program: {segments: [], events: []}},
      playlist: {list: []},
		}
  },

	componentWillMount() {
    this.reload()
  },

  reload() {
		ProgramActions.read(this.props.params.uuid)
		PlaylistActions.list()
  },

  saveName(name) {
    let r = ProgramActions.update.triggerAsync(this.state.program.program.uuid,
      {name: name})

    r.then(() => {
      FeedbackActions.set('success', this.props.t('common:alerts.namechanged'))
      ProgramActions.read(this.props.params.uuid)
    })
    return r
  },

	getLink() {
		var isEvent = this.props.children.props.route.eventView

		var to = isEvent ? `/program/${this.props.params.uuid}/`
                     : `/program/${this.props.params.uuid}/event`

		var ico = isEvent ? 'th-large' : 'calendar'

		var text = isEvent ? this.props.t('program:links.segment')
                       : this.props.t('program:links.event')

    return (
      <Link className='btn btn-default' to={to}>
        <Icon fa={ico} /> {text}
      </Link>
    )
	},

  verifyData(item) {
    return find(this.state.program.program.events, (v) => {
			if (v.uuid != item.uuid) {
				var [v0, v1] = v.range
				var [i0, i1] = item.range

				var overlap = Math.max(v0, i0) < Math.min(v1, i1)
				if (v.date == item.date && overlap) {
					return true
				}
			}
		})
	},

  saveProgram() {
    this.refs.editcontent.getWrappedInstance().child.save()
  },

	getButton() {
		var isEvent = this.props.children.props.route.eventView
    var to, text

		if (isEvent) {
			to = `/program/${this.props.params.uuid}/event/new`
			text = this.props.t('program:buttons.createevent')

			return (
				<Link to={to} className='btn btn-success'>
          <Icon fa='plus' /> {text}
        </Link>
			)
		} else {
			to = `/program/${this.props.params.uuid}/event`
			text = this.props.t('program:buttons.savesegments')

			return (
				<button onClick={this.saveProgram} className='btn btn-primary'>
          <Icon fa='check' /> {text}
        </button>
			)
		}
	},

	getName() {
		if (this.props.children.props.route.simpleHeader) {
			return <h1>{this.state.program.program.name}</h1>
		} else {
			return <InlineNameEdit
              name={this.state.program.program.name}
              uuid={this.state.program.program.uuid}
              saveAction={this.saveName} />
		}
	},
	
	getButtons() {
		if (this.props.children.props.route.simpleHeader) {
			return null
		} else {
			return [this.getLink(), ' ', this.getButton()]
		}
	},

  render() {
    var childrenProps = {
      playlists: this.state.playlist.list,
      program: this.state.program.program,
      verifyData: this.verifyData,
      parentReload: this.reload,
      ref: 'editcontent'
    }

    return (
      <Grid fluid>
				<Row>
					<Col xs={6}>
						{this.getName()}
					</Col>
					<Col xs={6} className='text-right h1'>
						{this.getButtons()}
					</Col>
				</Row>
        <Row>
          <Col xs={12}>
            <Feedback />
          </Col>
        </Row>
				{React.cloneElement(this.props.children, childrenProps)}
			</Grid>
    )
  }
}))
