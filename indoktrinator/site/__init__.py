#!/usr/bin/python3 -tt
# -*- coding: utf-8 -*-

__all__ = ['make_site']

from sqlalchemy import *
from sqlalchemy.exc import *
from werkzeug.exceptions import *
from indoktrinator.site.util import *
from functools import wraps
from base64 import b64decode


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
    manager.app = app

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
        return True
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
        db.rollback()
        return response

    @app.route('/custom')
    def custom():
        return flask.render_template('custom.html', get=flask.request.args.get('get'))

    @app.route('/')
    @authorized_only(privilege='user')
    def index():
        nonlocal has_privilege

        return flask.render_template('index.html', **locals())

    # Devices
    @app.route('/api/device/', methods=['GET', 'POST'])
    @authorized_only()
    def device_handler(**kwargs):
        if 'GET' == flask.request.method:
            return flask.jsonify(result=manager.device.list())

        if 'POST' == flask.request.method:
            device = flask.request.get_json(force=True)
            try:
                if 'photo' in device:
                    start = device['photo'].find(',')
                    if start < 0:
                        start = 0
                    device['photo'] = b64decode(device['photo'][start:])
            except:
                device['photo'] = None
            return flask.jsonify(manager.device.insert(device))

    @app.route('/api/device/<id>', methods=['GET', 'DELETE', 'PATCH'])
    @authorized_only()
    def device_item_handler(id, **kwargs):
        if 'GET' == flask.request.method:
            return flask.jsonify(manager.device.get_item(id))
        if 'DELETE' == flask.request.method:
            return flask.jsonify(manager.device.delete(id))
        if 'PATCH' == flask.request.method:
            device = flask.request.get_json(force=True)
            device['id'] = id
            try:
                if 'photo' in device:
                    start = device['photo'].find(',')
                    if start < 0:
                        start = 0
                    device['photo'] = b64decode(device['photo'][start:])
            except:
                device['photo'] = None

            return flask.jsonify(manager.device.update(device))

    @app.route('/api/device/<id>/url', methods=['GET'])
    @authorized_only()
    def device_item_url(id):
        manager.router.url(id, url1=flask.request.args.get('url1'), url2=flask.request.args.get('url2'))
        return flask.jsonify(True)

    @app.route('/api/device/<id>/play', methods=['GET'])
    @authorized_only()
    def device_item_play(id):
        manager.router.play(id, flask.request.args.get('type'), flask.request.args.get('url'))
        return flask.jsonify(True)

    # Files
    @app.route('/api/file/', methods=['GET'])
    @authorized_only()
    def file_handler(**kwargs):
        if 'GET' == flask.request.method:
            # TODO: Check, if cache is nesesery
            if manager.file.changed:
                file_handler.cache = flask.jsonify(result=manager.file.list())
                manager.file.changed = False
            return file_handler.cache

    @app.route('/api/file/<uuid>', methods=['GET'])
    @authorized_only()
    def file_item_handler(uuid, **kwargs):
        if 'GET' == flask.request.method:
            return flask.jsonify(manager.file.get_item(uuid))

    # Events
    @app.route('/api/event/', methods=['GET', 'POST'])
    @authorized_only()
    def event_handler(**kwargs):
        if 'GET' == flask.request.method:
            return flask.jsonify(result=manager.event.list())
        if 'POST' == flask.request.method:
            return flask.jsonify(manager.event.insert(
                flask.request.get_json(force=True)
            ))

    @app.route('/api/event/<uuid>', methods=['GET', 'DELETE', 'PATCH'])
    @authorized_only()
    def event_item_handler(uuid, **kwargs):
        if 'GET' == flask.request.method:
            return flask.jsonify(manager.event.get_item(uuid))
        if 'DELETE' == flask.request.method:
            return flask.jsonify(manager.event.delete(uuid))
        if 'PATCH' == flask.request.method:
            event = flask.request.get_json(force=True)
            event['uuid'] = uuid
            return flask.jsonify(manager.event.update(event))

    # Items
    @app.route('/api/item/', methods=['GET', 'POST'])
    @authorized_only()
    def item_handler(**kwargs):
        if 'GET' == flask.request.method:
            return flask.jsonify(result=manager.item.list())
        if 'POST' == flask.request.method:
            return flask.jsonify(manager.item.insert(flask.request.get_json(force=True)))

    @app.route('/api/item/<uuid>', methods=['GET', 'DELETE', 'PATCH'])
    @authorized_only()
    def item_item_handler(uuid, **kwargs):
        if 'GET' == flask.request.method:
            return flask.jsonify(manager.item.get_item(uuid))
        if 'DELETE' == flask.request.method:
            return flask.jsonify(manager.item.delete(uuid))
        if 'PATCH' == flask.request.method:
            item = flask.request.get_json(force=True)
            item['uuid'] = uuid
            return flask.jsonify(manager.item.update(item))

    # Playlists
    @app.route('/api/playlist/', methods=['GET', 'POST'])
    @authorized_only()
    def playlist_handler(**kwargs):
        if 'GET' == flask.request.method:
            return flask.jsonify(result=manager.playlist.list())
        if 'POST' == flask.request.method:
            playlist = flask.request.get_json(force=True)
            playlist['system'] = False
            return flask.jsonify(manager.playlist.insert(playlist))

    @app.route('/api/playlist/<uuid>', methods=['GET', 'DELETE', 'PATCH'])
    @authorized_only()
    def playlist_item_handler(uuid, **kwargs):
        if 'GET' == flask.request.method:
            return flask.jsonify(manager.playlist.get_item(uuid))
        if 'DELETE' == flask.request.method:
            # TODO: bug v triggeru pri zmene itemu
            return flask.jsonify(manager.playlist.delete(uuid))
        if 'PATCH' == flask.request.method:

            playlist = flask.request.get_json(force=True)
            playlist['uuid'] = uuid
            tmp = manager.playlist.get_item(uuid)
            if tmp['system']:
                return Forbidden('System playlist can not be modified')
            tmp['system'] = False

            if 'path' in playlist and playlist['path']:
                manager.item.e().filter_by(playlist=uuid).delete()

            return flask.jsonify(manager.playlist.update(playlist))

    @app.route('/api/playlist/<uuid>/items', methods=['GET'])
    @authorized_only()
    def playlist_item_items_handler(uuid, **kwargs):
        if 'GET' == flask.request.method:
            return flask.jsonify(manager.item.list({'playlist': uuid}))

    @app.route('/api/playlist/<uuid>/copy', methods=['GET'])
    @authorized_only()
    def playlist_item_copy_handler(uuid, **kwargs):
        playlist_item_copy_handler.copy = getattr(
            playlist_item_copy_handler, 'copy', 0
        ) + 1

        if 'GET' == flask.request.method:
            old_playlist = manager.playlist.get_item(uuid)
            new_playlist = old_playlist.copy()
            new_playlist['uuid'] = None
            new_playlist['name'] += ' Copy %d' % playlist_item_copy_handler.copy
            new_playlist['system'] = False
            new = manager.playlist.insert(new_playlist)
            new['items'] = []

            for item in old_playlist['items']:
                item['playlist'] = new['uuid']
                item['uuid'] = None
                new['items'].append(manager.item.insert(item))

            return flask.jsonify(new)

    # Programs
    @app.route('/api/program/', methods=['GET', 'POST'])
    @authorized_only()
    def program_handler(**kwargs):
        if 'GET' == flask.request.method:
            return flask.jsonify(result=manager.program.list())
        if 'POST' == flask.request.method:
            return flask.jsonify(manager.program.insert(
                flask.request.get_json(force=True)
            ))

    @app.route('/api/program/<uuid>', methods=['GET', 'DELETE', 'PATCH'])
    @authorized_only()
    def program_item_handler(uuid, **kwargs):
        if 'GET' == flask.request.method:
            return flask.jsonify(manager.program.get_item(uuid))
        if 'DELETE' == flask.request.method:
            return flask.jsonify(manager.program.delete(uuid))
        if 'PATCH' == flask.request.method:
            program = flask.request.get_json(force=True)
            program['uuid'] = uuid
            return flask.jsonify(manager.program.update(program))

    # Segments
    @app.route('/api/segment/', methods=['GET', 'POST'])
    @authorized_only()
    def segment_handler(**kwargs):
        if 'GET' == flask.request.method:
            print(manager.segment.list())
            return flask.jsonify(result=manager.segment.list())
        if 'POST' == flask.request.method:
            return flask.jsonify(manager.segment.insert(
                flask.request.get_json(force=True)
            ))

    @app.route('/api/segment/<uuid>', methods=['GET', 'DELETE', 'PATCH'])
    @authorized_only()
    def segment_item_handler(uuid, **kwargs):
        if 'GET' == flask.request.method:
            return flask.jsonify(manager.segment.get_item(uuid))
        if 'DELETE' == flask.request.method:
            return flask.jsonify(manager.segment.delete(uuid))
        if 'PATCH' == flask.request.method:
            segment = flask.request.get_json(force=True)
            segment['uuid'] = uuid
            return flask.jsonify(manager.segment.update(segment))

    # Logged user info
    @app.route('/api/user-info/', methods=['GET'])
    @pass_user_info
    def userinfo_handler(**kwargs):
        return ''
        info = kwargs
        info['networks'] = manager.network.network_acls(kwargs['privileges'])
        return flask.jsonify(**info)

    @app.route('/media/<path:path>')
    def media(path):
        path = manager.config['path'] + '/' + path
        print(path)
        os.path.exists(path)
        f = open(path, 'rb')

        def generate():
            data = f.read(2048)
            while data:
                yield data
                data = f.read(2048)
            f.close()

        return flask.Response(generate(), mimetype="application/octet-stream")

    return app


# vim:set sw=4 ts=4 et:
