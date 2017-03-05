import * as React from 'react'
import * as Reflux from 'reflux'
import {Modal} from 'react-bootstrap'
import ReactDOM from 'react-dom'
import classNames from 'classnames'
import {ProgramStore} from '../stores/Program'
import {ProgramActions} from '../actions'

let Header = Modal.Header
let Body = Modal.Body
let Footer = Modal.Footer

export var Select = React.createClass({

  mixins: [Reflux.connect(ProgramStore, 'data')],

  getDefaultProps() {
    return {
      'show': true,
      't': function() {return ''},
    }
  },

  getInitialState() {
    return {data: {list: []}}
  },

  componentWillMount() {
    ProgramActions.list()
  },

  componentDidMount() {
    this.promise = $.Deferred()
  },

  getHeader() {
    return <Header closeButton={true}>
      <h4 className="modal-title">
          {this.props.t('device:programselect.title')}
      </h4>
    </Header>
  },

  getBody() {
    return <Body>
      <ul className="list-group">
        <a onClick={this.select.bind(null, null)}
          className={classNames('list-group-item', 'list-group-item-danger')}>
          {this.props.t('device:programselect.noprogram')}
        </a>

        {this.state.data.list.map((item) => {
          return (
            <a onClick={this.select.bind(null, item.uuid)}
              className={classNames('list-group-item', {'list-group-item-info': item.uuid == this.props.selected})}>
              {item.name}
            </a>)
        })}
        </ul>
      </Body>
  },

  getFooter() {

    return (
      <Footer></Footer>
    )
  },

  select(id) {
    this.promise.resolve(id)
  },

  abort() {
    this.promise.reject()
  },

  render() {
    return (
      <Modal show={this.props.show}
        onHide={this.abort}
        keyboard={true}>
        {this.getHeader()}
        {this.getBody()}
        {this.getFooter()}
      </Modal>
    )
  }
})

export function getModal(selected, others, show, translate) {
  return <Select selected={selected}
                 show={show}
                 t={translate}
                 {...others}  />
}

export function programSelectionModal(selected, others, translate) {
  var modal = getModal(selected, others, true, translate)
  var wrapper = document.body.appendChild(document.createElement('div'))
  var component = ReactDOM.render(modal, wrapper)
  component.promise.always(() => {
    ReactDOM.render(getModal(null, others, false, translate), wrapper)
    setTimeout(() => {
      ReactDOM.unmountComponentAtNode(wrapper)
      wrapper.remove()
    })
  }).promise()
  return component.promise
}
