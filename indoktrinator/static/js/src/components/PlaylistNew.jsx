import * as React from 'react'
import * as Reflux from 'reflux'
import {PlaylistActions, FeedbackActions} from '../actions'
import {PlaylistStore} from '../stores/Playlist'
import {hashHistory as BrowserHistory} from 'react-router'
import {Feedback} from './Feedback'
import {FormGroup, ControlLabel, FormControl, Form, Button} from 'react-bootstrap'
import {Panel} from 'react-bootstrap'
import {Col, Row, Grid} from 'react-bootstrap'
import {translate} from 'react-i18next'

export var PlaylistNew = translate(['playlist', 'common'])(React.createClass({

  getInitialState() {
    return {name: ''}
  },

  handleChange(evt) {
    this.setState({[evt.target.name]: evt.target.value})
  },

  validate() {
    var r = []

    if (!this.state.name) {
      r.push(this.props.t('validation.required', {name: '$t(labels.name)'}))
    }

    return r
  },

  save(e) {
    e.preventDefault()
    var errors = this.validate()

    if (errors.length > 0) {
      FeedbackActions.set('error', this.props.t('alerts.invalidform'), errors)
    } else {
      PlaylistActions.create.triggerAsync({name: this.state.name})
      .then((data) => {
        BrowserHistory.push('/playlist/' + data.uuid)
        FeedbackActions.set('success', this.props.t('common:alerts.create'))
      })
    }
  },

  cancel() {
    BrowserHistory.push('/playlist/')
  },

  render() {
		const {t} = this.props

    var footer = (
      <Row>
        <Col xs={12} className='text-right'>
          <Button bsStyle='default'
                  onClick={this.cancel}>
            {t('playlist:buttons.new.cancel')}
          </Button>
          <Button bsStyle='primary'
                  type='submit'>
            {t('playlist:buttons.new.create')}
          </Button>
        </Col>
      </Row>
    )

    return (
      <Grid fluid>
        <Col xs={12} sm={6} smOffset={3}>
          <Form horizontal onSubmit={this.save}>
            <Panel header={t('playlist:new.title')} footer={footer}>
              <FormGroup>
                <Col xs={3} componentClass={ControlLabel}>
                  {t('playlist:labels.name')}
                </Col>
                <Col xs={9}>
                  <FormControl
                    type="text"
                    onChange={this.handleChange}
                    value={this.state.name}
                    autoFocus
                  />
                </Col>
              </FormGroup>
            </Panel>
          </Form>
        </Col>
      </Grid>
    )
  }

}))
