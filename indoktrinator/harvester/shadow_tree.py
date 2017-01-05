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
        self.moves = {}

    def start(self):
        """
        Start tree monitoring.
        """

        self.notify.startReading()
        self.root.scan()

    def begin_move(self, child, cookie):
        """
        Begin a new file move.
        """

        self.moves[cookie] = Move(child, cookie)
        return self.moves[cookie]

    def finish_move(self, dest, name, cookie):
        """
        Successfully end a file move.
        """

        if cookie in self.moves:
            move = self.moves.pop(cookie)
            move.finish(dest, name)
            return True

        return False

    def fail_move(self, cookie):
        """
        Discard a failed file move record.
        """

        if cookie in self.moves:
            self.moves.pop(cookie)

    def on_update(self, node):
        log.msg('Node {!r} updated.'.format(node.path))

    def on_delete(self, node):
        log.msg('Node {!r} deleted.'.format(node.path))

    def on_move(self, node):
        log.msg('Node {!r} moved.'.format(node.path))


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
            self.watch = self.tree.notify.watch(self.path, self.on_event,
                                                mask=IN_TREE_EVENTS)
            self.tree.on_move(self)

        if not self.is_dir:
            return

        tries = 3
        while True:
            try:
                missing = set(self.children)
                base, dirs, files = next(walk(self.path))

                for dname in dirs:
                    missing.discard(dname)
                    self.add_child(dname, True)

                for fname in files:
                    missing.discard(fname)
                    self.add_child(fname, False)

                for child in missing:
                    child = self.children.pop(missing)
                    child.lost()

                break

            except OSError:
                log.msg('Failed to scan {!r}.'.format(self.path))

                if tries == 0:
                    tries -= 1
                    log.err()
                    continue

                log.msg('Giving up.')
                raise

    def rename(self, dest, name):
        """
        Change node parent and name in reaction to a move.
        """

        self.prev = self.path

        self.parent = dest
        self.parent.children[name] = self
        self.path = join(dest.path, name)

        self.tree.on_move(self)

        for child_name, child in self.children.items():
            child.rename(self, child_name)

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

        self.watch.ignore()
        self.tree.on_delete(self)

    def on_event(self, event, **kwargs):
        """Called when a file system change is detected."""

        handler = 'on_' + event

        assert kwargs.pop('watch') is self.watch

        if hasattr(self, handler):
            # log.msg('Handle {!r} {!r}...'.format(event, kwargs))
            getattr(self, handler)(**kwargs)
        else:
            log.msg('No handler for {!r} {!r}.'.format(event, kwargs))

    def on_close_write(self, name=None, is_dir=False):
        if name is None:
            # Obtain the event from the parent directory,
            # not from the file itself. No need to update twice.
            return

        child = self.add_child(name, is_dir)
        self.tree.on_update(child)

    def on_create(self, name, is_dir=False):
        try:
            # We might lose the race to install the watch.
            child = self.add_child(name, is_dir)
        except OSError:
            return

        self.tree.on_update(child)

    def on_delete(self, name, is_dir=False):
        if name in self.children:
            self.children.pop(name)

    def on_moved_from(self, name, cookie, is_dir=False):
        if name in self.children:
            # Remove the child from this parent and start a delayed lost.
            # It can be interrupted by a successfull move to another node.
            child = self.children.pop(name)
            self.tree.begin_move(child, cookie)

    def on_moved_to(self, name, cookie, is_dir=False):
        # Try to finish an intra-tree move.
        if self.tree.finish_move(self, name, cookie):
            return

        # It failed, which means that we did not know about it,
        # ergo it came from the outside of the tree.
        if is_dir:
            self.on_create(name, is_dir)
        else:
            self.on_close_write(name, is_dir)

    def on_delete_self(self, is_dir=False):
        self.tree.on_delete(self)

    def on_ignored(self):
        pass


class Move:
    """Process of file move."""

    def __init__(self, node, cookie):
        self.node = node
        self.cookie = cookie
        self.timer = reactor.callLater(0.1, self.lost)

    def finish(self, dest, name):
        try:
            self.timer.cancel()
            self.node.rename(dest, name)
        except AlreadyCalled:
            pass

    def lost(self):
        self.node.tree.fail_move(self.cookie)
        self.node.lost()


if __name__ == '__main__':
    from sys import stderr

    log.startLogging(stderr)

    tree = Tree('/tmp/indoktrinator')
    reactor.callLater(0, tree.start)
    reactor.run()


# vim:set sw=4 ts=4 et:
