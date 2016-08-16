#!/usr/bin/python3 -tt
# -*- coding: utf-8 -*-

__all__ = ['make_site']

from sqlalchemy import *
from sqlalchemy.exc import *
from werkzeug.exceptions import *
from indoktrinator.site.util import *
from functools import wraps


from sqlalchemy import desc
from sqlalchemy.exc import SQLAlchemyError
from datetime import date, datetime, timedelta
from xml.sax.saxutils import escape

import flask
import os
import re

def make_site(db, manager, access_model, debug=False):
    app = flask.Flask('.'.join(__name__.split('.')[:-1]))
    app.secret_key = os.urandom(16)
    app.debug = debug

    @app.template_filter('to_alert')
    def category_to_alert(category):
        return {
            'warning': 'alert-warning',
            'error': 'alert-danger',
        }[category]

    @app.template_filter('to_icon')
    def category_to_icon(category):
        return {
            'warning': 'pficon-warning-triangle-o',
            'error': 'pficon-error-circle-o',
        }[category]

    def get_roles():
        roles = flask.request.headers.get('X-Roles', '')

        if not roles or '(null)' == roles:
            roles = ['impotent']
        else:
            roles = re.findall(r'\w+', roles)

        return roles

    def has_privilege(privilege):
        return access_model.have_privilege(privilege, get_roles())

    def pass_user_info(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            uid = flask.request.headers.get('X-User-Id', '0')
            username = flask.request.headers.get('X-Full-Name', 'Someone')
            roles = get_roles()
            privs = []

            for role in roles:
                privs.extend(access_model.privileges(role))

            kwargs.update({
                'uid': int(uid),
                'username': username.encode('latin1').decode('utf8'),
                'privileges': privs
            })

            return fn(*args, **kwargs)
        return wrapper


    def authorized_only(privilege='user'):
        def make_wrapper(fn):
            @wraps(fn)
            def wrapper(*args, **kwargs):
                if not has_privilege(privilege):
                    raise Forbidden('RBAC Forbidden')

                return fn(*args, **kwargs)

            return wrapper
        return make_wrapper


    @app.errorhandler(Forbidden.code)
    def unauthorized(e):
        return flask.render_template('forbidden.html')

    @app.errorhandler(SQLAlchemyError)
    def handle_sqlalchemy_error(error):
        response = flask.jsonify({'message': str(error)})
        response.status_code = 500
        return response

    @app.route('/')
    @authorized_only(privilege='user')
    def index():
        nonlocal has_privilege

        return flask.render_template('index.html', **locals())


    # Devices
    @app.route('/device/', methods=['GET', 'POST'])
    @authorized_only()
    def device_handler(**kwargs):
        if 'GET' == flask.request.method:
            return flask.jsonify(result=manager.device.list())
        if 'POST' == flask.request.method:
            return flask.jsonify(manager.device.insert(flask.request.get_json(force=True)))

    @app.route('/device/<uuid>', methods=['GET', 'DELETE', 'PATCH'])
    @authorized_only()
    def device_item_handler(uuid, **kwargs):
        if 'GET' == flask.request.method:
            return flask.jsonify(manager.device.get_item(uuid))
        if 'DELETE' == flask.request.method:
            return flask.jsonify(manager.device.delete(uuid))
        if 'PATCH' == flask.request.method:
            device = flask.request.get_json(force=True)
            device['uuid'] = uuid
            return flask.jsonify(manager.device.patch(device))


    # Events
    @app.route('/event/', methods=['GET', 'POST'])
    @authorized_only()
    def event_handler(**kwargs):
        if 'GET' == flask.request.method:
            return flask.jsonify(result=manager.event.list())
        if 'POST' == flask.request.method:
            return flask.jsonify(manager.event.insert(flask.request.get_json(force=True)))

    @app.route('/event/<uuid>', methods=['GET', 'DELETE', 'PATCH'])
    @authorized_only()
    def event_item_handler(uuid, **kwargs):
        if 'GET' == flask.request.method:
            return flask.jsonify(manager.event.get_item(uuid))
        if 'DELETE' == flask.request.method:
            return flask.jsonify(manager.event.delete(uuid))
        if 'PATCH' == flask.request.method:
            event = flask.request.get_json(force=True)
            event['uuid'] = uuid
            return flask.jsonify(manager.event.patch(event))


    # Items
    @app.route('/item/', methods=['GET', 'POST'])
    @authorized_only()
    def item_handler(**kwargs):
        if 'GET' == flask.request.method:
            return flask.jsonify(result=manager.item.list())
        if 'POST' == flask.request.method:
            return flask.jsonify(manager.item.insert(flask.request.get_json(force=True)))

    @app.route('/item/<uuid>', methods=['GET', 'DELETE', 'PATCH'])
    @authorized_only()
    def item_item_handler(uuid, **kwargs):
        if 'GET' == flask.request.method:
            return flask.jsonify(manager.item.get_item(uuid))
        if 'DELETE' == flask.request.method:
            return flask.jsonify(manager.item.delete(uuid))
        if 'PATCH' == flask.request.method:
            item = flask.request.get_json(force=True)
            item['uuid'] = uuid
            return flask.jsonify(manager.item.patch(item))


    # Playlists
    @app.route('/playlist/', methods=['GET', 'POST'])
    @authorized_only()
    def playlist_handler(**kwargs):
        if 'GET' == flask.request.method:
            return flask.jsonify(result=manager.playlist.list())
        if 'POST' == flask.request.method:
            return flask.jsonify(manager.playlist.insert(flask.request.get_json(force=True)))

    @app.route('/playlist/<uuid>', methods=['GET', 'DELETE', 'PATCH'])
    @authorized_only()
    def playlist_item_handler(uuid, **kwargs):
        if 'GET' == flask.request.method:
            return flask.jsonify(manager.playlist.get_item(uuid))
        if 'DELETE' == flask.request.method:
            return flask.jsonify(manager.playlist.delete(uuid))
        if 'PATCH' == flask.request.method:
            playlist = flask.request.get_json(force=True)
            playlist['uuid'] = uuid
            return flask.jsonify(manager.playlist.patch(playlist))


    # Programs
    @app.route('/program/', methods=['GET', 'POST'])
    @authorized_only()
    def program_handler(**kwargs):
        if 'GET' == flask.request.method:
            return flask.jsonify(result=manager.program.list())
        if 'POST' == flask.request.method:
            return flask.jsonify(manager.program.insert(flask.request.get_json(force=True)))

    @app.route('/program/<uuid>', methods=['GET', 'DELETE', 'PATCH'])
    @authorized_only()
    def program_item_handler(uuid, **kwargs):
        if 'GET' == flask.request.method:
            return flask.jsonify(manager.program.get_item(uuid))
        if 'DELETE' == flask.request.method:
            return flask.jsonify(manager.program.delete(uuid))
        if 'PATCH' == flask.request.method:
            program = flask.request.get_json(force=True)
            program['uuid'] = uuid
            return flask.jsonify(manager.program.patch(program))


    # Segments
    @app.route('/segment/', methods=['GET', 'POST'])
    @authorized_only()
    def segment_handler(**kwargs):
        if 'GET' == flask.request.method:
            return flask.jsonify(result=manager.segment.list())
        if 'POST' == flask.request.method:
            return flask.jsonify(manager.segment.insert(flask.request.get_json(force=True)))

    @app.route('/segment/<uuid>', methods=['GET', 'DELETE', 'PATCH'])
    @authorized_only()
    def segment_item_handler(uuid, **kwargs):
        if 'GET' == flask.request.method:
            return flask.jsonify(manager.segment.get_item(uuid))
        if 'DELETE' == flask.request.method:
            return flask.jsonify(manager.segment.delete(uuid))
        if 'PATCH' == flask.request.method:
            segment = flask.request.get_json(force=True)
            segment['uuid'] = uuid
            return flask.jsonify(manager.segment.patch(segment))

    # Logged user info
    @app.route('/user-info/', methods=['GET'])
    @pass_user_info
    def userinfo_handler(**kwargs):
        return ''
        info = kwargs
        info['networks'] = manager.network.network_acls(kwargs['privileges'])
        return flask.jsonify(**info)



    return app


# vim:set sw=4 ts=4 et:
