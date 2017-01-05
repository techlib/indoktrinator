#!/usr/bin/python3 -tt
# -*- coding: utf-8 -*-

from twisted.python import log
from twisted.python.procutils import which
from twisted.internet.task import LoopingCall
from twisted.internet import reactor, utils

from os.path import sep, join, relpath, isfile, isdir
from natsort import natsorted, ns
from simplejson import loads
from base64 import b64decode

from indoktrinator.harvester.shadow_tree import *
from indoktrinator.utils import with_session


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

    def on_move(self, node):
        """
        A file or directory has been moved.

        We do not get to know the original file location, since moves are
        also used to inform us about initially watched files. When a playlist
        directory or file moves, we need to extract its unique identifier
        and use it to locate the database record to update.
        """

        playlist, item = self.parse_path(node.path)

        # Ignore the top-level directory.
        if playlist is None:
            return

        log.msg('Node {!r} moved.'.format(relpath(node.path, self.path)))

        if node.is_dir:
            if item is None:
                # A playlist directory has been moved.
                self.rename_playlist(playlist, node)

        else:
            if item is not None:
                # A file has been moved.
                self.rename_item(playlist, item, node)

    @with_session
    def update_playlist(self, playlist, node):
        token = node.token
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
        path = relpath(node.path, self.path)

        def probe_done(info):
            self.update_item_with_info(playlist, item, node, info)

        def probe_failed(err):
            log.msg('Failed to analyze file {!r}.'.format(node.path))

        log.msg('Probing file {!r}...'.format(path))
        d = probe_file(node.path)
        d.addCallbacks(probe_done, probe_failed)

    @with_session
    def update_item_with_info(self, playlist, item, node, info):
        token = node.token
        path = relpath(node.path, self.path)

        if 'unknown:' in token:
            log.msg('Node {!r} disappeared, aborting.'.format(path))
            return

        file = self.db.file.filter_by(path=path).one_or_none()

        if file is None:
            log.msg('Create file {!r}...'.format(path))
            file = self.db.file.insert(**{
                'path': path,
                'token': token,
                'duration': info['duration'],
                'preview': info.get('preview'),
                'type': info['type'],
            })

            self.db.flush()
        else:
            if 'unknown:' not in token:
                file.token = token

            file.duration = info['duration']
            file.preview = info.get('preview')
            file.type = info['type']

        items = self.db.item.filter_by(file=file.uuid).all()
        if len(items) > 0:
            return

        # Determine correct playlist for the file.
        plst = self.db.playlist.filter_by(path=playlist).one_or_none()

        if plst is not None:
            # FIXME: Calculate position properly.

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

    @with_session
    def rename_playlist(self, playlist, node):
        token = node.token
        path = relpath(node.path, self.path)
        plst = None

        if node.prev is not None:
            # We have previous file name and thus can perform the move
            # with 100% confidence in the correct result.
            prev = relpath(node.prev, self.path)
            plst = self.db.playlist.filter_by(path=prev).one_or_none()

        if plst is None:
            # Without previous path we can rely only on the token.
            plst = self.db.playlist.filter_by(token=token).one_or_none()

        if plst is not None:
            if plst.path == path and plst.token == token:
                # Nothing to update, playlist is still good.
                return

            log.msg('Rename playlist {!r} -> {!r}...'.format(plst.path, path))

            # Perform the update.
            plst.path = path
            plst.name = path

            # We might have been unable to obtain the token,
            # so do not damage the previous one.
            if 'unknown:' not in token:
                plst.token = token

        else:
            log.msg('Failed to move playlist {!r}, updating.'.format(playlist))
            self.update_playlist(playlist, node)

    @with_session
    def rename_item(self, playlist, item, node):
        token = node.token
        path = relpath(node.path, self.path)
        file = None

        if node.prev is not None:
            # We have previous file name and thus can perform the move
            # with 100% confidence in the correct result.
            prev = relpath(node.prev, self.path)
            file = self.db.file.filter_by(path=prev).one_or_none()

        if file is None:
            # Without previous path we can rely only on the token.
            file = self.db.file.filter_by(token=token).one_or_none()

        if file is not None:
            if file.path == path and file.token == token:
                # Nothing to update, item is still good.
                return

            log.msg('Rename item {!r} -> {!r}...'.format(file.path, path))

            # Determine correct playlist for the file.
            plst = self.db.playlist.filter_by(path=playlist).one_or_none()

            if plst is not None:
                # We happen to know the correct playlist, so update it.
                file.playlist = plst.uuid
            else:
                log.msg('Failed to locate playlist {!r}.'.format(playlist))

            # Update path to the file.
            file.path = path

            # We might have been unable to obtain the token,
            # so do not damage the previous one.
            if 'unknown:' not in token:
                file.token = token

        else:
            log.msg('Failed to move item {!r}, updating.'.format(path))
            self.update_item(playlist, item, node)


def probe_file(filepath):
    paths = which('indoktrinator-probe')

    if not paths:
        log.msg('The indoktrinator-probe is not in PATH, aborting.')

    d = utils.getProcessOutput(paths[0], (filepath,))
    d.addCallback(decode_preview)
    return d


def decode_preview(data):
    data = loads(data.decode('utf-8'))
    data['preview'] = b64decode(data['preview'])
    return data


# vim:set sw=4 ts=4 et:
