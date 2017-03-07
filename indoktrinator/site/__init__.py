#!/usr/bin/python3 -tt
# -*- coding: utf-8 -*-

from twisted.python import log

from werkzeug.exceptions import Forbidden, NotFound
from flask_cors import CORS
from flask import Flask, Response, request, render_template, jsonify, \
                  send_file, send_from_directory

from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from sqlalchemy import desc

from os.path import dirname, join
from functools import wraps
from base64 import b64decode
from time import time
from os import urandom
from re import findall
from io import BytesIO
from imghdr import what

from indoktrinator.site.util import internal_origin_only
from indoktrinator.site.model import Model
from indoktrinator.db import with_db_session


__all__ = ['make_site']


DEFAULT_DEVICE_PHOTO = join(dirname(__file__), '../static/img/display.png')
DEFAULT_FILE_PREVIEW = join(dirname(__file__), '../static/img/video.png')


def make_site(db, manager, access_model, debug=False, auth=False, cors=False):
    """
    Create the WSGI site object using Flask.
    """

    app = Flask('.'.join(__name__.split('.')[:-1]))
    app.secret_key = urandom(16)
    app.debug = debug

    if cors:
        CORS(app)

    # JSON-compatible database access layer for the endpoints below.
    model = Model(db)

    def has_privilege(privilege):
        roles = request.headers.get('X-Roles', '')

        if not roles or '(null)' == roles:
            roles = ['impotent']
        else:
            roles = findall(r'\w+', roles)

        return access_model.have_privilege(privilege, roles)

    def pass_user_info(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            uid = request.headers.get('X-User-Id', '0')
            username = request.headers.get('X-Full-Name', 'Someone')

            kwargs.update({
                'uid': int(uid),
                'username': username.encode('latin1').decode('utf8'),
            })

            return fn(*args, **kwargs)
        return wrapper

    def pass_depth(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            kwargs['depth'] = int(request.args.get('depth', '0'))
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
        return render_template('forbidden.html')

    @app.errorhandler(IntegrityError)
    def integrity_error(error):
        log.msg('IntegrityError: {}'.format(error))

        response = jsonify({
            'error': 'integrity',
            'message': str(error.orig),
        })

        response.status_code = 400
        return response

    @app.errorhandler(SQLAlchemyError)
    def sqlalchemy_error(error):
        log.msg('SQLAlchemyError: {}'.format(error))

        response = jsonify({
            'error': 'database',
            'message': str(error.orig),
        })

        response.status_code = 400
        return response

    @app.errorhandler(KeyError)
    def key_error(error):
        log.msg('KeyError: {}'.format(error))

        response = jsonify({
            'error': 'key',
            'message': str(error),
        })

        response.status_code = 404
        return response

    @app.errorhandler(ValueError)
    def value_error(error):
        log.msg('ValueError: {}'.format(error))

        response = jsonify({
            'error': 'value',
            'message': str(error),
        })

        response.status_code = 400
        return response

    @app.route('/')
    @authorized_only('user')
    def index():
        nonlocal has_privilege
        return render_template('index.html', **locals())

    @app.route('/api/device/', methods=['GET', 'POST'])
    @authorized_only('user')
    @pass_depth
    @with_db_session(db)
    def api_devices(depth, **kwargs):
        if 'GET' == request.method:
            devices = []
            persistent = set()

            for device in model.device.list(depth=depth):
                persistent.add(device['id'])
                status = manager.devices.get(device['id'], {})
                devices.append(dict(device, **{
                    'online': status.get('last_seen', 0) > time() - 300,
                    'power': status.get('power', False),
                    'hostname': status.get('hostname')
                }))

            for devid, status in manager.devices.items():
                if devid not in persistent:
                    devices.insert(0, {
                        'id': devid,
                        'pending': True,
                        'online': status.get('last_seen', 0) > time() - 300,
                        'power': status.get('power', False),
                        'hostname': status.get('hostname')
                    })

            return jsonify(result=devices)

        if 'POST' == request.method:
            device = request.get_json(force=True)
            return jsonify(model.device.insert(device, depth=depth))

    @app.route('/api/device/<id>', methods=['GET', 'DELETE', 'PATCH'])
    @authorized_only('user')
    @pass_depth
    @with_db_session(db)
    def api_device(id, depth, **kwargs):
        if 'GET' == request.method:
            try:
                device = model.device.get(id, depth=depth)
            except KeyError:
                device = manager.devices.get(id)
                device.update({'pending': True})

            status = manager.devices.get(id, {})

            return jsonify(dict(device, **{
                'online': status.get('last_seen', 0) > time() - 300,
                'power': status.get('power', False),
            }))

        if 'DELETE' == request.method:
            return jsonify(deleted=model.device.delete(id))

        if 'PATCH' == request.method:
            patch = request.get_json(force=True)
            return jsonify(model.device.update(id, patch, depth=depth))

    @app.route('/api/file/', methods=['GET'])
    @authorized_only('user')
    @pass_depth
    @with_db_session(db)
    def api_files(depth, **kwargs):
        if 'GET' == request.method:
            return jsonify(result=model.file.list(depth=depth))

    @app.route('/api/file/<uuid>', methods=['GET'])
    @authorized_only('user')
    @pass_depth
    @with_db_session(db)
    def api_file(uuid, depth, **kwargs):
        if 'GET' == request.method:
            return jsonify(model.file.get(uuid, depth=depth))

    @app.route('/api/event/', methods=['GET', 'POST'])
    @authorized_only('user')
    @pass_depth
    @with_db_session(db)
    def api_events(depth, **kwargs):
        if 'GET' == request.method:
            return jsonify(result=model.event.list(depth=depth))

        if 'POST' == request.method:
            data = request.get_json(force=True)
            return jsonify(model.event.insert(data, depth=depth))

    @app.route('/api/event/<uuid>', methods=['GET', 'DELETE', 'PATCH'])
    @authorized_only('user')
    @pass_depth
    @with_db_session(db)
    def api_event(uuid, depth, **kwargs):
        if 'GET' == request.method:
            return jsonify(model.event.get(uuid, depth=depth))

        if 'DELETE' == request.method:
            return jsonify(model.event.delete(uuid))

        if 'PATCH' == request.method:
            event = request.get_json(force=True)
            return jsonify(model.event.update(uuid, event, depth=depth))

    @app.route('/api/item/', methods=['GET', 'POST'])
    @authorized_only('user')
    @pass_depth
    @with_db_session(db)
    def api_items(depth, **kwargs):
        if 'GET' == request.method:
            return jsonify(result=model.item.list(depth=depth))

        if 'POST' == request.method:
            item = request.get_json(force=True)
            return jsonify(model.item.insert(item, depth=depth))

    @app.route('/api/item/<uuid>', methods=['GET', 'DELETE', 'PATCH'])
    @authorized_only('user')
    @pass_depth
    @with_db_session(db)
    def api_item(uuid, depth, **kwargs):
        if 'GET' == request.method:
            return jsonify(model.item.get(uuid, depth=depth))

        if 'DELETE' == request.method:
            return jsonify(deleted=model.item.delete(uuid))

        if 'PATCH' == request.method:
            patch = request.get_json(force=True)
            return jsonify(model.item.update(uuid, patch, depth=depth))

    @app.route('/api/playlist/', methods=['GET', 'POST'])
    @authorized_only('user')
    @pass_depth
    @with_db_session(db)
    def api_playlists(depth, **kwargs):
        if 'GET' == request.method:
            playlists = model.playlist.list(depth=depth)
            return jsonify(result=playlists)

        if 'POST' == request.method:
            playlist = request.get_json(force=True)
            return jsonify(model.playlist.insert(playlist, depth=depth))

    @app.route('/api/playlist/<uuid>', methods=['GET', 'DELETE', 'PATCH'])
    @authorized_only('user')
    @pass_depth
    @with_db_session(db)
    def api_playlist(uuid, depth, **kwargs):
        if 'GET' == request.method:
            return jsonify(model.playlist.get(uuid, depth=depth))

        if 'DELETE' == request.method:
            return jsonify(deleted=model.playlist.delete(uuid))

        if 'PATCH' == request.method:
            # We are going to play around with playlist items.
            # Make sure that the playlist is not managed by harvester.
            playlist = model.playlist.get(uuid)

            if playlist['token'] is not None:
                raise Forbidden()

            # Apply the patch without the `items` key.
            # We need to process it separately.
            patch = request.get_json(force=True)
            items = patch.pop('items', None)

            model.playlist.update(uuid, patch)

            if items is not None:
                # Delete all current items in that playlist.
                model.item.table.filter_by(playlist=uuid).delete()

                # Insert all the new items as usual.
                for item in items:
                    # Make sure that we are not inserting items for a different
                    # playlist. Set correct playlist for those without it.
                    if item.setdefault('playlist', uuid) != uuid:
                        raise ValueError(item)

                    model.item.insert(item)

            return jsonify(model.playlist.get(uuid, depth=depth))

    @app.route('/api/program/', methods=['GET', 'POST'])
    @authorized_only('user')
    @pass_depth
    @with_db_session(db)
    def api_programs(depth, **kwargs):
        if 'GET' == request.method:
            return jsonify(result=model.program.list(depth=depth))

        if 'POST' == request.method:
            program = request.get_json(force=True)
            return jsonify(model.program.insert(program, depth=depth))

    @app.route('/api/program/<uuid>', methods=['GET', 'DELETE', 'PATCH'])
    @authorized_only('user')
    @pass_depth
    @with_db_session(db)
    def api_program(uuid, depth, **kwargs):
        if 'GET' == request.method:
            return jsonify(model.program.get(uuid, depth=depth))

        if 'DELETE' == request.method:
            return jsonify(deleted=model.program.delete(uuid))

        if 'PATCH' == request.method:
            # Apply the patch without the `segments` key.
            # We need to process it separately.
            patch = request.get_json(force=True)
            segments = patch.pop('segments', None)

            model.program.update(uuid, patch)

            if segments is not None:
                # Delete all current segments in that program.
                model.segment.table.filter_by(program=uuid).delete()

                # Insert all the new segments as usual.
                for segment in segments:
                    # Make sure that we are not inserting segments for a different
                    # program. Set correct program for those without it.
                    if segment.setdefault('program', uuid) != uuid:
                        raise ValueError(segment)

                    model.segment.insert(segment)

            return jsonify(model.program.get(uuid, depth=depth))

    @app.route('/api/segment/', methods=['GET', 'POST'])
    @authorized_only('user')
    @pass_depth
    @with_db_session(db)
    def api_segments(depth, **kwargs):
        if 'GET' == request.method:
            return jsonify(result=model.segment.list(depth=depth))

        if 'POST' == request.method:
            segment = request.get_json(force=True)

            if segment.get('sidebar') and '://' not in segment['sidebar']:
                raise ValueError(segment)

            if segment.get('panel') and '://' not in segment['panel']:
                raise ValueError(segment)

            return jsonify(model.segment.insert(segment, depth=depth))

    @app.route('/api/segment/<uuid>', methods=['GET', 'DELETE', 'PATCH'])
    @authorized_only('user')
    @pass_depth
    @with_db_session(db)
    def api_segment(uuid, depth, **kwargs):
        if 'GET' == request.method:
            return jsonify(model.segment.get(uuid, depth=depth))

        if 'DELETE' == request.method:
            return jsonify(deleted=model.segment.delete(uuid))

        if 'PATCH' == request.method:
            patch = request.get_json(force=True)

            if patch.get('sidebar') and '://' not in patch['sidebar']:
                raise ValueError(patch)

            if patch.get('panel') and '://' not in patch['panel']:
                raise ValueError(patch)

            return jsonify(model.segment.update(uuid, patch, depth=depth))

    @app.route('/api/user-info/', methods=['GET'])
    @pass_user_info
    def api_user_info(**kwargs):
        return jsonify(kwargs)

    @app.route('/media/<path:path>')
    def media(path):
        # NOTE: This should never be used outside development.
        #       There should be an actual web server in front of the
        #       application that serves the /media directory faster.
        return send_from_directory(manager.media_path, path,
                                   mimetype='application/octet-stream')

    @app.route('/api/preview-image/device/<id>', methods=['GET', 'PUT', 'RESET'])
    @authorized_only('user')
    @with_db_session(db)
    def api_device_photo(id):
        if 'GET' == request.method:
            device_photo = db.device_photo.filter_by(id=id).one_or_none()

            if device_photo is None:
                return send_file(DEFAULT_DEVICE_PHOTO)

            resp = Response(device_photo.photo)
            resp.headers['Content-Type'] = device_photo.mime
            return resp

        elif 'PUT' == request.method:
            if request.content_length > 10e20:
                raise ValueError('image too large')

            with BytesIO(request.data) as fp:
                mime = what(fp)

            if mime not in ('jpeg', 'png', 'gif'):
                raise ValueError('image type {!r}'.format(mime))

            mime = 'image/{}'.format(mime)
            photo = db.device_photo.filter_by(id=id).one_or_none()

            if photo is None:
                db.device_photo.insert(id=id, photo=request.data, mime=mime)
            else:
                photo.mime = mime
                photo.photo = request.data

            return jsonify({'photo': id})

        elif 'RESET' == request.method:
            photo = db.device_photo.filter_by(id=id).one_or_none()

            if photo is not None:
                db.delete(photo)

            return jsonify(reset=id)

    @app.route('/api/preview-image/file/<uuid>')
    @authorized_only('user')
    @with_db_session(db)
    def api_file_preview(uuid):
        file_preview = db.file_preview.filter_by(uuid=uuid).one_or_none()

        if file_preview is None:
            return send_file(DEFAULT_FILE_PREVIEW)

        resp = Response(file_preview.preview)
        resp.headers['Content-Type'] = file_preview.mime
        return resp

    return app


# vim:set sw=4 ts=4 et:
