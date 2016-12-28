import * as React from 'react'
import * as Reflux from 'reflux'
import {FeedbackStore} from '../stores/Feedback'
import {Message} from './Message'
import {confirmModal} from './ModalConfirmMixin'

export var ErrorFeedback = React.createClass({
  mixins: [Reflux.connect(FeedbackStore, 'data')],

  data: {},

  componentWillUpdate: function (nextProps, nextState) {
    // if message is error, we want to show modal instead plain message
    if (nextState.data && nextState.data.type === 'error') {
      confirmModal(
        'Error',
        <Message type={nextState.data.type}
                 message={nextState.data.message}
                 extra={nextState.data.extra}/>,
        {canAbort: false}
      )
    }
  },

  render() {
    return null
  }

})
