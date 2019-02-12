#!/usr/bin/python3 -tt
# -*- coding: utf-8 -*-

from twisted.internet import reactor
from twisted.internet.error import AlreadyCalled
from twisted.python import log

from uuid import uuid4
from os.path import realpath, join, dirname, basename, exists
from os import walk, stat

from indoktrinator.inotify import *

__all__ = ['Tree']


IN_TREE_EVENTS = (IN_CREATE | IN_DELETE_SELF | IN_CLOSE_WRITE |
                  IN_MOVED_FROM | IN_MOVED_TO | IN_DELETE)


class Tree:
    def __init__(self, path, reactor=reactor):
        self.path = realpath(path)
        self.notify = INotify(reactor=reactor)
        self.root = Node(self, None, self.path, True)

    def start(self):
        """
        Start tree monitoring.
        """

        self.notify.startReading()
        self.root.scan()

    def on_update(self, node):
        log.msg('Node {!r} updated.'.format(node.path))

    def on_delete(self, node):
        log.msg('Node {!r} deleted.'.format(node.path))


class Node:
    def __init__(self, tree, parent, path, is_dir):
        self.tree = tree
        self.parent = parent
        self.is_dir = is_dir

        self.prev = None
        self.path = path

        self.children = {}
        self.watch = None

    @property
    def token(self):
        """
        Obtain a string token that uniquely identifies the file on this
        particular system. Currently uses stat(2) data.
        """

        try:
            st = stat(self.path)
        except OSError:
            return 'unknown:' + uuid4().hex

        if self.is_dir:
            return '{}:{}'.format(st.st_dev, st.st_ino)
        else:
            return '{}:{}:{}'.format(st.st_dev, st.st_ino, st.st_size)

    def scan(self):
        """
        Recursively scan and install watches.
        """

        if self.watch is None:
            try:
                self.watch = self.tree.notify.watch(self.path, self.on_event,
                                                    mask=IN_TREE_EVENTS)
            except OSError as exn:
                log.msg(str(exn))

            self.tree.on_update(self)

        if not self.is_dir:
            return

        missing = set(self.children)

        for base, dirs, files in walk(self.path):
            for dname in dirs:
                if not is_hidden(dname):
                    missing.discard(dname)
                    self.add_child(dname, True)

            for fname in files:
                if not is_hidden(fname):
                    missing.discard(fname)
                    self.add_child(fname, False)

            for child in missing:
                child = self.children.pop(missing)
                child.lost()

            break

    def add_child(self, name, is_dir):
        assert self.is_dir, 'Cannot add child node to a non-directory'

        if name not in self.children:
            path = join(self.path, name)
            self.children[name] = Node(self.tree, self, path, is_dir)
            self.children[name].scan()

        return self.children[name]

    def lost(self):
        """Called when lost due to a move or scan."""

        for child in self.children.values():
            child.lost()

        self.children = {}

        if self.watch is not None:
            try:
                self.watch.ignore()
            except OSError as exn:
                log.msg(str(exn))

        self.tree.on_delete(self)

    def on_event(self, event, **kwargs):
        """Called when a file system change is detected."""

        assert kwargs.pop('watch') is self.watch

        handler = 'on_' + event
        if hasattr(self, handler):
            getattr(self, handler)(**kwargs)

    def on_close_write(self, name=None, is_dir=False):
        if name is None:
            self.tree.on_update(self)
        elif not is_hidden(name):
            child = self.add_child(name, is_dir)
            self.tree.on_update(child)

    def on_create(self, name, is_dir=False):
        if not is_hidden(name):
            child = self.add_child(name, is_dir)
            self.tree.on_update(child)

    def on_delete(self, name, is_dir=False):
        if name in self.children:
            self.children.pop(name).lost()

    def on_moved_from(self, name, cookie, is_dir=False):
        if name in self.children:
            self.children.pop(name).lost()

    def on_moved_to(self, name, cookie, is_dir=False):
        if is_dir:
            self.on_create(name, is_dir)
        else:
            self.on_close_write(name, is_dir)

    def on_delete_self(self, is_dir=False):
        self.tree.on_delete(self)

    def on_ignored(self):
        pass


def is_hidden(dname):
    return dname[:1] in ('.', '_')


if __name__ == '__main__':
    from sys import stderr

    log.startLogging(stderr)

    tree = Tree('/tmp/indoktrinator')
    reactor.callLater(0, tree.start)
    reactor.run()


# vim:set sw=4 ts=4 et:
