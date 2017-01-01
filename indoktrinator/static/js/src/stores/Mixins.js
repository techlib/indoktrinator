/*
 * mixins.js
 * Copyright (C) 2016 ztf <ztf@phanes.zerusnet.com>
 *
 * Distributed under terms of the MIT license.
 */

export var ErrorMixin = {
  handleError: function (method, status, message) {
    this.data.errors = [{'method': method, 'status': status, 'message': message}]
    this.trigger(this.data)
  },
}

/*
 * Simple mixin to do async ajax requests with reflux and return promise from
 * action handler.
 *
 * In store action handler, use like this.req('GET', url, options),
 * where options is object with these possible keys:
 *
 * action: Reflux action object X. If provided, X.completed or X.failed will be
 *  resolved after request finished
 * dest: Destination in data attribute of store, where result will be saved
 *  (this is usually 'list' or 'device' or similar
 * data: data to send with requests like POST. Will be jsonified
 * transformResponse: if provided, received data will be passed to given function
 *  and replaced with value it returns.
 * handleError: if provided, this function is called on error
 *
 *  One of the main reasons for this whole thing is simplification of api calls
 *  (no need to repeat many options, that never change) and returning promises
 *  from reflux actions, that resolve after api call is complete.
 *  This is useful for notifications, redirects, etc
 */

export var Api = {
  req(method, url, options) {
    var params = {
      url: url,
      method: method,
      dataType: 'json',
      contentType: 'application/json',
    }

    if (options['data'] !== undefined) {
      params['data'] = JSON.stringify(options['data'])
    }

    var response = $.ajax(params)

    response.done((data, textStatus, jqXHR) => {
      this.data.errors = []

      if (options['modifyResponse'] !== undefined) {
        data = options['modifyResponse'](data)
      }

      if (options['dest'] !== undefined) {
        this.data[options['dest']] = data.result
      }

      this.trigger(this.data)

      if (options['action'] !== undefined &&
          options['action'].children.indexOf('completed') >= 0) {
            options['action'].completed(data)
        }
    })

    response.fail((jqXHR, textStatus, errorThrown) => {
      if (options['handleError'] !== undefined) {
          options['handleError'](jqXHR, textStatus, errorThrown)
      }
    })

    return response
  }

}
