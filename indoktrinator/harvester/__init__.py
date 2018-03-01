#!/usr/bin/python3 -tt
# -*- coding: utf-8 -*-

from twisted.python import log
from twisted.python.procutils import which
from twisted.internet.task import LoopingCall
from twisted.internet import reactor, utils

from os.path import sep, join, relpath, isfile, isdir, basename
from simplejson import loads
from base64 import b64decode

from indoktrinator.harvester.shadow_tree import *
from indoktrinator.db import with_session

import re


__all__ = ['Harvester']


class Harvester (Tree):
    """
    Filesystem tree observer that writes changes to
    playlists and their files into the database.
    """

    def __init__(self, db, path, reactor=reactor):
        super().__init__(path, reactor=reactor)
        self.db = db
        self.playlists = {}

    @with_session
    def start(self):
        log.msg('Starting file monitoring...')
        super().start()

        log.msg('Starting periodic missing file checks...')
        self.check_loop = LoopingCall(self.check_files)
        self.check_loop.start(60)

        log.msg('Harvester started.')

    @with_session
    def check_files(self):
        """
        Remove database files and playlists that no longer exist.
        """

        log.msg('Checking for missing files...')

        for file in self.db.file.all():
            if not isfile(join(self.path, file.path)):
                log.msg('Delete file {!r}...'.format(file.path))
                self.db.delete(file)

        for playlist in self.db.playlist.all():
            if playlist.path is not None:
                if not isdir(join(self.path, playlist.path)):
                    log.msg('Delete playlist {!r}...'.format(playlist.path))
                    self.db.delete(playlist)

    def parse_path(self, path):
        """
        Convert an absolute path to playlist name and relative item path.
        """

        path = relpath(path, self.path)

        if sep in path:
            playlist, item = path.split(sep, 1)
        else:
            playlist, item = path, None

        if playlist in ('.', '..'):
            playlist = None

        return (playlist, item)

    def on_update(self, node):
        """
        A file or directory has been created or updated.

        We are mostly interested in the files, because we need to trigger a
        file scan to determine their contents and properly enter them in the
        database as playlist items.

        Apart from files, we are interested in the directories at the top of
        the tree. They represent system playlists and we need to reflect them
        in the database.
        """

        playlist, item = self.parse_path(node.path)

        # Ignore the top-level directory.
        if playlist is None:
            return

        log.msg('Node {!r} updated.'.format(relpath(node.path, self.path)))

        if node.is_dir:
            if item is None:
                # A playlist directory might have been created.
                self.update_playlist(playlist, node)

        else:
            if item is not None:
                # A file has been modified.
                self.update_item(playlist, item, node)

    def on_delete(self, node):
        """
        A file or directory has been deleted.

        As with the updates, we are interested in playlist directory and
        file deletes. We do not care about deletes of the directories under
        the playlist level.
        """

        playlist, item = self.parse_path(node.path)

        # Ignore the top-level directory.
        if playlist is None:
            return

        log.msg('Node {!r} deleted.'.format(relpath(node.path, self.path)))

        if node.is_dir:
            if item is None:
                # A playlist directory has been deleted.
                self.delete_playlist(playlist, node)

        else:
            if item is not None:
                # A file has been deleted.
                self.delete_item(playlist, item, node)

    @with_session
    def update_playlist(self, playlist, node):
        token = node.token
        path = relpath(node.path, self.path)

        if 'unknown:' in token:
            log.msg('Node {!r} disappeared, aborting.'.format(path))
            return

        plst = self.db.playlist.filter_by(path=playlist).one_or_none()

        if plst is None:
            log.msg('Create playlist {!r}.'.format(playlist))
            plst = self.db.playlist.insert(**{
                'name': playlist,
                'path': playlist,
                'token': token,
                'duration': 0,
            })
        else:
            if 'unknown:' not in token:
                plst.token = token

    @with_session
    def delete_playlist(self, playlist, node):
        plst = self.db.playlist.filter_by(path=playlist).one_or_none()

        if plst is not None:
            log.msg('Delete playlist {!r}...'.format(playlist))
            self.db.delete(plst)

    def update_item(self, playlist, item, node):
        token = node.token
        path = relpath(node.path, self.path)

        file = self.db.file.filter_by(path=path).one_or_none()

        if file is not None:
            preview = self.db.file_preview \
                .filter_by(uuid=file.uuid) \
                .one_or_none()

            if token == file.token and preview and preview.preview:
                # We don't want to anylyze all files on every start.
                return

        def probe_done(info):
            if info is None:
                return

            if 'error' in info:
                log.msg('Probe error: {}\nfilename: {}\ndetail: {}'
                        .format(info.get('error'),
                                info.get('filename'),
                                info.get('message')))
                return

            self.update_item_with_info(playlist, item, node, info)

        log.msg('Probing file {!r}...'.format(path))
        d = probe_file(node.path)

        if d is not None:
            d.addCallback(probe_done)

    @with_session
    def update_item_with_info(self, playlist, item, node, info):
        token = node.token
        path = relpath(node.path, self.path)

        if 'unknown:' in token:
            log.msg('Node {!r} disappeared, aborting.'.format(path))
            return


        file = self.db.file.filter_by(path=path).one_or_none()

        if file is None:
            log.msg('Create file {!r} (preview={})...'
                    .format(path, 'preview' in info))
            if info['type'] == 'stream':
                with open('{0}/{1}'.format(self.path, path),'r') as text:
                    content = text.readlines()[0].strip()
                file = self.db.file.insert(**{
                    'path': path,
                    'token': token,
                    'duration': info['duration'],
                    'type': info['type'],
                    'stream_url': content,
                })
            else:
                file = self.db.file.insert(**{
                    'path': path,
                    'token': token,
                    'duration': info['duration'],
                    'type': info['type'],
                })

            self.db.flush()

            if info.get('preview'):
                preview = self.db.file_preview.insert(**{
                    'uuid': file.uuid,
                    'preview': info['preview'],
                })

                self.db.flush()

        else:
            log.msg('Update file {!r} (preview={})...'
                    .format(path, 'preview' in info))

            if info['type'] == 'stream':
                with open('{0}/{1}'.format(self.path, path), 'r') as text:
                    content = text.readlines()[0].strip()
                    file.stream_url = content
                    file.duration = info['duration']
                    file.type = info['type']
            
            else:            
                file.duration = info['duration']
                file.type = info['type']

            self.db.flush()

            if info.get('preview'):
                self.db.file_preview.filter_by(uuid=file.uuid).delete()
                self.db.file_preview.insert(**{
                    'uuid': file.uuid,
                    'preview': info['preview'],
                })

            self.db.flush()

        items = self.db.item.filter_by(file=file.uuid).all()
        if len(items) > 0:
            return

        # Determine correct playlist for the file.
        plst = self.db.playlist.filter_by(path=playlist).one_or_none()

        if plst is not None:
            log.msg('Create item {!r}...'.format(path))
            self.db.item.insert(**{
                'playlist': plst.uuid,
                'file': file.uuid,
                'position': 0,
                'duration': file.duration,
            })
        else:
            log.msg('Failed to locate playlist {!r}.'.format(playlist))

    @with_session
    def delete_item(self, playlist, item, node):
        path = relpath(node.path, self.path)
        file = self.db.file.filter_by(path=path).one_or_none()

        if file is not None:
            log.msg('Delete file {!r}...'.format(path))
            self.db.delete(file)


def probe_file(filepath):
    paths = which('indoktrinator-probe')

    if not paths:
        log.msg('The indoktrinator-probe is not in PATH, aborting.')
        return

    def probe_failed(exn):
        log.msg('Failed to analyze file {!r}.'.format(filepath))
        log.err(exn)

    d = utils.getProcessOutput(paths[0], (filepath,))
    d.addCallbacks(decode_preview, probe_failed)
    return d

def decode_preview(data):
    data = loads(data.decode('utf-8'))

    if 'preview' in data:
        data['preview'] = b64decode(data['preview'])

    return data


# vim:set sw=4 ts=4 et:
