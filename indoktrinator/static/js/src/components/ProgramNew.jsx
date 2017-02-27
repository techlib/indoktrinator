import * as React from 'react'
import * as Reflux from 'reflux'
import {ProgramActions, FeedbackActions} from '../actions'
import {hashHistory as BrowserHistory} from 'react-router'
import {translate} from 'react-i18next'
import {Feedback} from './Feedback'
import {ControlLabel, FormGroup, FormControl, Form, Button} from 'react-bootstrap'
import {Panel, Col, Row, Grid} from 'react-bootstrap'

export var ProgramNew = translate(['program'])(React.createClass({

  getInitialState() {
    return {name: ''}
  },

	handleChange(e) {
    this.setState({ name: e.target.value });
  },

  validate() {
    var r = []
    if (this.state.name.length == 0) {
			r.push(this.props.t('common:validation.required',
				{name: '$t(program:labels.name)'}))
		}

    return r
  },

  save(e) {
    e.preventDefault()
		var errors = this.validate()

		if (errors.length == 0) {
      ProgramActions.create.triggerAsync({name: this.state.name})
      .then((data) => {
        BrowserHistory.push('/program/' + data.uuid)
        FeedbackActions.set('success', this.props.t('common:alerts.create'))
      })
    } else {
        FeedbackActions.set('error', this.props.t('common:alerts.invalidform'), errors)
    }

  },

  cancel() {
    BrowserHistory.push('/program/')
  },

  render() {
		const {t} = this.props

    var footer = (
      <Row>
        <Col xs={12} className='text-right'>
          <Button bsStyle='default'
                  onClick={this.cancel}>
              {t('program:buttons.new.cancel')}
          </Button>
          <Button bsStyle='primary'
                  onClick={this.save}
                  type='submit'>
            {t('program:buttons.new.create')}
          </Button>
        </Col>
      </Row>
    )

    return (
      <Grid fluid>
        <Col xs={12} sm={6} smOffset={3}>
        <h1>
          {t('program:titlenew')}
        </h1>
        <Row>
          <Col xs={12}>
            <Panel header={t('program:new.title')} footer={footer}>
              <Form horizontal onSubmit={this.save}>
                <FormGroup>
                  <Col xs={3} componentClass={ControlLabel}>
                    {t('program:labels.name')}
                  </Col>
                  <Col xs={9}>
                    <FormControl
                      type="text"
                      name="name"
                      onChange={this.handleChange}
                      value={this.state.name}
                      autoFocus
                    />
                  </Col>
                </FormGroup>
              </Form>
            </Panel>
          </Col>
        </Row>
        </Col>
      </Grid>)
  }
}))
