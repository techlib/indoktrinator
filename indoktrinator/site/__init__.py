#!/usr/bin/python3 -tt
# -*- coding: utf-8 -*-

from twisted.python import log

from sqlalchemy import *
from sqlalchemy.exc import *
from werkzeug.exceptions import *

from functools import wraps
from base64 import b64decode
from os.path import dirname, join

from sqlalchemy import desc
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from datetime import date, datetime, timedelta
from xml.sax.saxutils import escape
from flask_cors import CORS

from indoktrinator.site.util import *

import flask
import os
import re


__all__ = ['make_site']


DEFAULT_DEVICE_PHOTO = join(dirname(__file__), '../static/img/display.png')
DEFAULT_FILE_PREVIEW = join(dirname(__file__), '../static/img/video.png')


def make_site(db, manager, access_model, debug=False, auth=False, cors=False):
    """
    Create the WSGI site object using Flask.
    """

    app = flask.Flask('.'.join(__name__.split('.')[:-1]))
    app.secret_key = os.urandom(16)
    app.debug = debug

    if cors:
        CORS(app)

    def has_privilege(privilege):
        roles = flask.request.headers.get('X-Roles', '')

        if not roles or '(null)' == roles:
            roles = ['impotent']
        else:
            roles = re.findall(r'\w+', roles)

        return access_model.have_privilege(privilege, roles)

    def pass_user_info(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            uid = flask.request.headers.get('X-User-Id', '0')
            username = flask.request.headers.get('X-Full-Name', 'Someone')

            kwargs.update({
                'uid': int(uid),
                'username': username.encode('latin1').decode('utf8'),
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
        log.msg('SQLAlchemyError: {}'.format(error))
        response = flask.jsonify({
            'message': str(error.orig),
        })
        response.status_code = 500
        return response

    @app.route('/')
    @authorized_only('user')
    def index():
        nonlocal has_privilege
        return flask.render_template('index.html', **locals())

    # Devices
    @app.route('/api/device/', methods=['GET', 'POST'])
    @authorized_only('user')
    def device_handler(**kwargs):
        if 'GET' == flask.request.method:
            result = manager.device.list()
            for r in result:
                r['photo'] = flask.url_for('device_photo', id=r['id'])

            return flask.jsonify(result=result)

        if 'POST' == flask.request.method:
            device = flask.request.get_json(force=True)
            return flask.jsonify(manager.device.insert(device))

    @app.route('/api/device/<id>', methods=['GET', 'DELETE', 'PATCH'])
    @authorized_only('user')
    def device_item_handler(id, **kwargs):
        if 'GET' == flask.request.method:
            result = manager.device.get_item(id)
            result['photo'] = flask.url_for('device_photo', id=result['id'])
            return flask.jsonify(result)

        if 'DELETE' == flask.request.method:
            return flask.jsonify(manager.device.delete(id))

        if 'PATCH' == flask.request.method:
            device = flask.request.get_json(force=True)
            device['id'] = id
            return flask.jsonify(manager.device.update(device))

    @app.route('/api/file/', methods=['GET'])
    @authorized_only('user')
    def file_handler(**kwargs):
        if 'GET' == flask.request.method:
            result = manager.file.list()
            for r in result:
                r['preview'] = flask.url_for('file_preview', uuid=r['uuid'])

            return flask.jsonify(result=result)

    @app.route('/api/file/<uuid>', methods=['GET'])
    @authorized_only('user')
    def file_item_handler(uuid, **kwargs):
        if 'GET' == flask.request.method:
            r = manager.file.get_item(uuid)
            r['preview'] = flask.url_for('file_preview', uuid=r['uuid'])
            return flask.jsonify(r)

    @app.route('/api/event/', methods=['GET', 'POST'])
    @authorized_only('user')
    def event_handler(**kwargs):
        if 'GET' == flask.request.method:
            return flask.jsonify(result=manager.event.list())

        if 'POST' == flask.request.method:
            try:
                return flask.jsonify(manager.event.insert(
                    flask.request.get_json(force=True)
                ))
            except IntegrityError as e:
                # FIXME: Use some generic DB error handling infrastructure.
                #        Plus this is definitely not a 500 error.
                response = flask.jsonify({'message': 'Invalid intersection'})
                response.status_code = 500
                return response

    @app.route('/api/event/<uuid>', methods=['GET', 'DELETE', 'PATCH'])
    @authorized_only('user')
    def event_item_handler(uuid, **kwargs):
        if 'GET' == flask.request.method:
            return flask.jsonify(manager.event.get_item(uuid))

        if 'DELETE' == flask.request.method:
            return flask.jsonify(manager.event.delete(uuid))

        if 'PATCH' == flask.request.method:
            try:
                event = flask.request.get_json(force=True)
                event['uuid'] = uuid
                return flask.jsonify(manager.event.update(event))
            except IntegrityError as e:
                response = flask.jsonify({'message': 'Invalid intersection'})
                response.status_code = 500
                return response

    @app.route('/api/item/', methods=['GET', 'POST'])
    @authorized_only('user')
    def item_handler(**kwargs):
        if 'GET' == flask.request.method:
            result = manager.item.list()
            for r in result:
                preview = flask.url_for('file_preview', uuid=r['_file']['id'])
                r['_file']['preview'] = preview

            return flask.jsonify(result=result)

        if 'POST' == flask.request.method:
            data = flask.request.get_json(force=True)
            item = manager.item.insert(data)
            return flask.jsonify(item)

    @app.route('/api/item/<uuid>', methods=['GET', 'DELETE', 'PATCH'])
    @authorized_only('user')
    def item_item_handler(uuid, **kwargs):
        if 'GET' == flask.request.method:
            result = manager.item.get_item(uuid)
            preview = flask.url_for('file_preview', uuid=result['_file']['id'])
            result['_file']['preview'] = preview

            return flask.jsonify(result)

        if 'DELETE' == flask.request.method:
            return flask.jsonify(manager.item.delete(uuid))

        if 'PATCH' == flask.request.method:
            item = flask.request.get_json(force=True)
            item['uuid'] = uuid
            return flask.jsonify(manager.item.update(item))

    @app.route('/api/playlist/', methods=['GET', 'POST'])
    @authorized_only('user')
    def playlist_handler(**kwargs):
        if 'GET' == flask.request.method:
            return flask.jsonify(result=manager.playlist.list())

        if 'POST' == flask.request.method:
            playlist = flask.request.get_json(force=True)
            playlist['system'] = False
            return flask.jsonify(manager.playlist.insert(playlist))

    @app.route('/api/playlist/<uuid>', methods=['GET', 'DELETE', 'PATCH'])
    @authorized_only('user')
    def playlist_item_handler(uuid, **kwargs):
        if 'GET' == flask.request.method:
            result = manager.playlist.get_item(uuid)
            for i in result['items']:
                preview = flask.url_for('file_preview', uuid=i['file']['uuid'])
                i['file']['preview'] = preview

            return flask.jsonify(result)

        if 'DELETE' == flask.request.method:
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

            return flask.jsonify(manager.playlist.patch(playlist, uuid))

    @app.route('/api/playlist/<uuid>/items', methods=['GET'])
    @authorized_only('user')
    def playlist_item_items_handler(uuid, **kwargs):
        if 'GET' == flask.request.method:
            result = manager.item.list({'playlist': uuid})
            for r in result:
                p = flask.url_for('file_preview', uuid=r['_file']['uuid'])
                r['_file']['preview'] = p

            return flask.jsonify(result)

    @app.route('/api/program/', methods=['GET', 'POST'])
    @authorized_only('user')
    def program_handler(**kwargs):
        if 'GET' == flask.request.method:
            return flask.jsonify(result=manager.program.list(order_by=['name']))

        if 'POST' == flask.request.method:
            return flask.jsonify(manager.program.insert(
                flask.request.get_json(force=True)
            ))

    @app.route('/api/program/<uuid>', methods=['GET', 'DELETE', 'PATCH'])
    @authorized_only('user')
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
    @authorized_only('user')
    def segment_handler(**kwargs):
        if 'GET' == flask.request.method:
            return flask.jsonify(result=manager.segment.list())

        if 'POST' == flask.request.method:
            segment = flask.request.get_json(force=True)
            segment['day'] %= 7

            if segment.get('sidebar') and '://' not in segment['sidebar']:
                segment['sidebar'] = 'http://' + segment['sidebar']

            if segment.get('panel') and '://' not in segment['panel']:
                segment['panel'] = 'http://' + segment['panel']

            try:
                return flask.jsonify(manager.segment.insert(segment))
            except IntegrityError as e:
                response = flask.jsonify({'message': 'Invalid intersection'})
                response.status_code = 500
                return response

    @app.route('/api/segment/<uuid>', methods=['GET', 'DELETE', 'PATCH'])
    @authorized_only('user')
    def segment_item_handler(uuid, **kwargs):
        if 'GET' == flask.request.method:
            return flask.jsonify(manager.segment.get_item(uuid))

        if 'DELETE' == flask.request.method:
            return flask.jsonify(manager.segment.delete(uuid))

        if 'PATCH' == flask.request.method:
            segment = flask.request.get_json(force=True)

            segment['uuid'] = uuid
            segment['day'] %= 7

            if segment.get('sidebar') and '://' not in segment['sidebar']:
                segment['sidebar'] = 'http://' + segment['sidebar']

            if segment.get('panel') and '://' not in segment['panel']:
                segment['panel'] = 'http://' + segment['panel']

            try:
                return flask.jsonify(manager.segment.update(segment))
            except IntegrityError as e:
                response = flask.jsonify({'message': 'Invalid intersection'})
                response.status_code = 500
                return response

    @app.route('/api/user-info/', methods=['GET'])
    @pass_user_info
    def userinfo_handler(**kwargs):
        return flask.jsonify(kwargs)

    @app.route('/media/<path:path>')
    def media(path):
        # NOTE: This should never be used outside development.
        #       There should be an actual web server in front of the
        #       application that serves the /media directory faster.
        return flask.send_from_directory(manager.media_path, path,
                                         mimetype='application/octet-stream')

    @app.route('/api/preview-image/device/<id>')
    def device_photo(id):
        device_photo = db.device_photo.filter_by(id=id).one_or_none()

        if device_photo is None:
            return flask.send_file(DEFAULT_DEVICE_PHOTO)

        resp = flask.Response(device_photo.photo)
        resp.headers['Content-Type'] = device_photo.mime
        return resp

    @app.route('/api/preview-image/file/<uuid>')
    def file_preview(uuid):
        file_preview = db.file_preview.filter_by(uuid=uuid).one_or_none()

        if file_preview is None:
            return flask.send_file(DEFAULT_FILE_PREVIEW)

        resp = flask.Response(file_preview.preview)
        resp.headers['Content-Type'] = file_preview.mime
        return resp

    return app


# vim:set sw=4 ts=4 et:
