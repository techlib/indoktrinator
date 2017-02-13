import * as React from 'react'
import {FeedbackActions, DeviceActions} from '../actions'
import {Feedback} from './Feedback'
import {Input} from 'react-bootstrap'
import {BootstrapSelect} from './Select'
import FileBase64 from '../util/react-file-base64.js'
import {Button} from 'react-bootstrap'
import {StoreTypes} from './../stores/StoreTypes'
import {translate} from 'react-i18next'
import Dropzone from 'react-dropzone'

export var Device = translate('device')(React.createClass({

  commonProps: {
    labelClassName: 'col-xs-2',
    wrapperClassName: 'col-xs-10',
  },

  onDrop: function (acceptedFiles, rejectedFiles) {

    //DeviceActions.setImage.triggerAsync(acceptedFiles[0], this.state.id)

    this.setState({'preview': acceptedFiles[0].preview, 'photo': acceptedFiles[0]})
  },

  getInitialState() {
    return {}
  },

  componentWillReceiveProps(p) {
    this.setState(
      {
        'id': p.device.id,
        'photo': p.device.photo,
        'preview': p.device.photo,
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

  handleChange(evt) {
    this.setState({[evt.target.name]: evt.target.value})
  },

  save() {
    var errors = this.validate()

    if (errors.length > 0) {
      FeedbackActions.set('error', this.props.t('common:alerts.invalidform'), errors)
    } else {
      if(this.state.program=='none'){
        this.props.saveHandler({id: this.state.id, name: this.state.name, program: null, photo: this.state.photo})
      } else {
        this.props.saveHandler({id: this.state.id, name: this.state.name, program: this.state.program, photo: this.state.photo})
      }
    }
  },

  delete() {
    this.props.deleteHandler(this.state.id)
  },

  render() {
    const {t} = this.props

    return (
      <div className='col-xs-12 container-fluid'>
        <Feedback />
        <div className='row'>
          <div className='col-xs-12 col-md-6 col-md-offset-3'>
            <h1>{this.state.title}</h1>
            <div className='panel panel-default'>
              <div className='panel-heading'>
                {t('device:labels.title')}
              </div>
              <div className='panel-body'>
                <div className="form-horizontal">
                  { this.state.state != StoreTypes.LOADED ? <Input
                    type="text"
                    label={t('device:labels.id')}
                    ref="id"
                    name="id"
                    onChange={this.handleChange}
                    value={this.state.id}
                    {...this.commonProps} />
                    : null }
                  <Input
                    type="text"
                    label={t('device:labels.name')}
                    ref="name"
                    name="name"
                    onChange={this.handleChange}
                    value={this.state.name}
                    {...this.commonProps} />
                  <BootstrapSelect
                    label={t('device:labels.program')}
                    ref='program'
                    name='program'
                    onChange={this.handleChange}
                    data-live-search={true}
                    value={this.state.program}
                    {...this.commonProps}>
                        <option value='none'>{t('device:programselect.noprogram')}</option>
                        {this.props.program.map((item) => {
                          return <option value={item.uuid} key={item.uuid}>
                            {item.name}</option>
                        })}
                  </BootstrapSelect>
                  <div className="form-group">
                    <label className="control-label col-xs-2">
                      {t('device:labels.photo')}
                    </label>
                    <div className='col-xs-10'>
                        <Dropzone multiple={false} accept={['image/png', 'image/jpeg', 'image/gif']} onDrop={this.onDrop}>
                            <div className="col-xs-10 col-xs-offset-1">{t('device:labels.dropzone')}</div>
                        </Dropzone>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="control-label col-xs-2">
                      {t('device:labels.preview')}
                    </label>
                    <div className="col-xs-10">
                      <img className="img-responsive" src={this.state.preview}></img>
                    </div>
                  </div>
                </div>
              </div>
              <div className='panel-footer'>
                <div className="row">
                  <div className="col-xs-6">
                    { this.state.state == StoreTypes.LOADED ? <Button bsStyle="danger" onClick={this.delete}>{t('device:delete')}</Button> : null }
                  </div>
                  <div className="col-xs-6">
                    <Button bsStyle="primary" className="pull-right" onClick={this.save}>{t('device:save')}</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}))
