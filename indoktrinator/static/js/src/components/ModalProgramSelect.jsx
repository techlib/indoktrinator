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
      'abortLabel': 'Cancel',
      'abortClass': 'default',
      'show': true,
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
    ReactDOM.findDOMNode(this.refs.abort).focus()
  },

  getHeader() {
    return <Header>
      <h4 className="modal-title">
        Select program
      </h4>
    </Header>
  },

  getBody() {
    return <Body>
      <ul className="list-group">
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
    var clsAbort = classNames('btn', 'btn-' + this.props.abortClass)

    return (
      <Footer>
          <button 
            role='abort'
            ref='abort'
            className={clsAbort}
            className='pull-right'
            onClick={this.abort}>
            {this.props.abortLabel}
          </button>
          <button
            role='abort'
            className='btn btn-danger pull-left'
            onClick={this.select.bind(null, null)}>
            no program
          </button>

      </Footer>
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

export function getModal(selected, others, show) {
  return <Select selected={selected}
                 show={show}
                 {...others}  />
}

export function programSelectionModal(selected, others) {
  var modal = getModal(selected, others, true)
  var wrapper = document.body.appendChild(document.createElement('div'))
  var component = ReactDOM.render(modal, wrapper)
  component.promise.always(() => {
    ReactDOM.render(getModal(null, null, others, false), wrapper)
    setTimeout(() => {
      ReactDOM.unmountComponentAtNode(wrapper)
      wrapper.remove()
    })
  }).promise()
  return component.promise
}
