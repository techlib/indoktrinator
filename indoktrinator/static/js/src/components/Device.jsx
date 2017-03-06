import * as React from 'react'
import {FeedbackActions} from '../actions'
import {Feedback} from './Feedback'
import {hashHistory as BrowserHistory} from 'react-router'
import {Col, Row, Grid, FormGroup, FormControl, ControlLabel, Form, Button, Panel} from 'react-bootstrap'
import {BootstrapSelect} from './Select'
import {StoreTypes} from './../stores/StoreTypes'
import {translate} from 'react-i18next'
import Dropzone from 'react-dropzone'

export var Device = translate(['common', 'device'])(React.createClass({

  onDrop: function (acceptedFiles) {
    this.setState({'preview': acceptedFiles[0].preview, 'photo': acceptedFiles[0], 'custom_photo': true})
  },

  getInitialState() {
    return {}
  },

  componentWillReceiveProps(p) {
    // Invalidate cache
    if (p.device.photo === undefined) {
        p.device.photo = `/api/preview-image/device/0?${Date.now()}`
    }
    var preview = p.device.photo + '?c=' + Date.now()
    this.setState(
      {
        'id': p.device.id,
        'photo': p.device.photo,
        'custom_photo': p.device.custom_photo,
        'preview': preview,
        'name': p.device.name,
        'title': p.device.name,
        'state': p.device.state,
        'program': p.device.program ? p.device.program : 'none'
      }
    )
  },

  validate() {
    var r = []

    if (!this.state.name) {
      r.push('Name is required')
    }

    if (!this.state.id) {
      r.push('Id is required')
    }

    return r
  },

  resetImage() {
    this.setState({'preview': `/api/preview-image/device/0?${Date.now()}`, 'photo': 'deleted', 'custom_photo': false})
  },

  handleChange(evt) {
    this.setState({[evt.target.name]: evt.target.value})
  },

  save(e) {
    e.preventDefault()
    var errors = this.validate()

    if (errors.length > 0) {
      FeedbackActions.set('error', this.props.t('common:alerts.invalidform'), errors)
    } else {
      if(this.state.program=='none') {
        this.props.saveHandler({id: this.state.id, name: this.state.name, program: null, photo: this.state.photo})
      } else {
        this.props.saveHandler({id: this.state.id, name: this.state.name, program: this.state.program, photo: this.state.photo})
      }
    }
  },

  delete() {
    this.props.deleteHandler(this.state.id)
  },

  cancel() {
    BrowserHistory.push('/device/')
  },


  render() {
    const {t} = this.props

    var footer =(
      <Row>
        <Col xs={6}>
        { this.state.state == StoreTypes.LOADED ? <Button bsStyle="danger" onClick={this.delete}>{t('device:delete')}</Button> : null }
        { this.state.custom_photo ? <Button bsStyle="warning" onClick={this.resetImage}>{t('device:resetImage')}</Button> : null }
        { this.state.state == StoreTypes.NEW ? <Button bsStyle='default' onClick={this.cancel}>{t('program:buttons.new.cancel')}</Button>: null }
        </Col>
        <Col xs={6}>
          <Button bsStyle="primary"
                  className="pull-right"
                  type='submit'
                  onClick={this.save}>{t('device:save')}
          </Button>
        </Col>
      </Row>
    )
    return (
      <Grid fluid>
        <Row>
          <Form horizontal onSubmit={this.save}>
            <Col xs={12} md={6} mdOffset={3}>
            <h1>{this.state.title}</h1>
            <Feedback />
            <Panel bsStyle='default'
              header={t('device:labels.title')}
              footer={footer}>
              <FormGroup>
                <Col xs={2} componentClass={ControlLabel}>
                  {t('device:labels.id')}
                </Col>
                <Col xs={10}>
                  <FormControl
                    type="text"
                    name="id"
                    disabled={this.state.state != StoreTypes.NEW}
                    onChange={this.handleChange}
                    value={this.state.id} />
                </Col>
              </FormGroup>
              <FormGroup>
                <Col xs={2} componentClass={ControlLabel}>
                  {t('device:labels.name')}
                </Col>
                <Col xs={10}>
                  <FormControl
                    type="text"
                    name="name"
                    onChange={this.handleChange}
                    value={this.state.name} />
                </Col>
              </FormGroup>
              <FormGroup>
                <Col xs={2} componentClass={ControlLabel}>
                  {t('device:labels.program')}
                </Col>
                <Col xs={10}>
                  <BootstrapSelect
                    name='program'
                    onChange={this.handleChange}
                    data-live-search={true}
                    value={this.state.program}>
                        <option value='none'>{t('device:programselect.noprogram')}</option>
                        {this.props.program.map((item) => {
                          return <option value={item.uuid} key={item.uuid}>
                            {item.name}</option>
                        })}
                      </BootstrapSelect>
                    </Col>
                  </FormGroup>
              <FormGroup>
                <Col xs={2} componentClass={ControlLabel}>
                  {t('device:labels.photo')}
                </Col>
                <Col xs={10} sm={4}>
                  <Dropzone multiple={false}
                    accept={['image/png', 'image/jpeg', 'image/gif']}
                    onDrop={this.onDrop}>
                    <Col xs={10} xsOffset={1}>
                      {t('device:labels.dropzone')}
                    </Col>
                </Dropzone>
                </Col>
                <Col sm={6} xs={12}>
                  <img className="img-responsive"
                       src={this.state.preview} style={{height: 250}}></img>
                </Col>
                </FormGroup>
            </Panel>
          </Col>
        </Form>
      </Row>
    </Grid>
    )
  }
}))
