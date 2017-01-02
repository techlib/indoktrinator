#!/usr/bin/python3 -tt
# -*- coding: utf-8 -*-

from twisted.internet import reactor
from twisted.internet import fdesc
from twisted.internet.abstract import FileDescriptor
from twisted.python import log

from struct import unpack
from os.path import realpath

from indoktrinator.ffi import inotify as ffi

__all__ = ['INotify',
           'IN_ACCESS', 'IN_MODIFY', 'IN_ATTRIB', 'IN_CLOSE_WRITE',
           'IN_CLOSE_NOWRITE', 'IN_OPEN', 'IN_MOVED_FROM', 'IN_MOVED_TO',
           'IN_CREATE', 'IN_DELETE', 'IN_DELETE_SELF', 'IN_MOVE_SELF',
           'IN_UNMOUNT', 'IN_Q_OVERFLOW', 'IN_IGNORED', 'IN_CLOSE',
           'IN_MOVE', 'IN_ONLYDIR', 'IN_DONT_FOLLOW', 'IN_EXCL_UNLINK',
           'IN_MASK_ADD', 'IN_ISDIR', 'IN_ONESHOT', 'IN_ALL_EVENTS']


# from /usr/src/linux/include/linux/inotify.h

# Supported events suitable for MASK parameter of INOTIFY_ADD_WATCH.
IN_ACCESS        = 0x00000001  # File was accessed.
IN_MODIFY        = 0x00000002  # File was modified.
IN_ATTRIB        = 0x00000004  # Metadata changed.
IN_CLOSE_WRITE   = 0x00000008  # Writtable file was closed.
IN_CLOSE_NOWRITE = 0x00000010  # Unwrittable file closed.
IN_OPEN          = 0x00000020  # File was opened.
IN_MOVED_FROM    = 0x00000040  # File was moved from X.
IN_MOVED_TO      = 0x00000080  # File was moved to Y.
IN_CREATE        = 0x00000100  # Subfile was created.
IN_DELETE        = 0x00000200  # Subfile was deleted.
IN_DELETE_SELF   = 0x00000400  # Self was deleted.
IN_MOVE_SELF     = 0x00000800  # Self was moved.

# Events sent by the kernel.
IN_UNMOUNT       = 0x00002000  # Backing fs was unmounted.
IN_Q_OVERFLOW    = 0x00004000  # Event queued overflowed.
IN_IGNORED       = 0x00008000  # File was ignored.

# Helper events.
IN_CLOSE         = IN_CLOSE_WRITE | IN_CLOSE_NOWRITE
IN_MOVE          = IN_MOVED_FROM  | IN_MOVED_TO

# Special flags.
IN_ONLYDIR       = 0x01000000  # Only watch the path if it is a directory.
IN_DONT_FOLLOW   = 0x02000000  # Do not follow a sym link.
IN_EXCL_UNLINK   = 0x04000000  # Exclude events on unlinked objects.
IN_MASK_ADD      = 0x20000000  # Add to the mask of an already existing watch.
IN_ISDIR         = 0x40000000  # Event occurred against dir.
IN_ONESHOT       = 0x80000000  # Only send event once.

IN_ALL_EVENTS    = (IN_CREATE | IN_ACCESS | IN_MODIFY | IN_ATTRIB | IN_OPEN |
                    IN_CLOSE_WRITE | IN_CLOSE_NOWRITE | IN_DELETE_SELF |
                    IN_MOVED_FROM | IN_MOVED_TO | IN_DELETE | IN_MOVE_SELF)

# Mapping of flags to human-readable names.
FLAG_TO_HUMAN = [
    (IN_ACCESS, 'access'),
    (IN_MODIFY, 'modify'),
    (IN_ATTRIB, 'attrib'),
    (IN_CLOSE_WRITE, 'close_write'),
    (IN_CLOSE_NOWRITE, 'close_nowrite'),
    (IN_OPEN, 'open'),
    (IN_MOVED_FROM, 'moved_from'),
    (IN_MOVED_TO, 'moved_to'),
    (IN_CREATE, 'create'),
    (IN_DELETE, 'delete'),
    (IN_DELETE_SELF, 'delete_self'),
    (IN_MOVE_SELF, 'move_self'),
    (IN_UNMOUNT, 'unmount'),
    (IN_Q_OVERFLOW, 'queue_overflow'),
    (IN_IGNORED, 'ignored'),
    (IN_ONLYDIR, 'only_dir'),
    (IN_DONT_FOLLOW, 'dont_follow'),
    (IN_EXCL_UNLINK, 'exclude_unlink'),
    (IN_MASK_ADD, 'mask_add'),
    (IN_ISDIR, 'is_dir'),
    (IN_ONESHOT, 'one_shot'),
]


class INotify (FileDescriptor):
    """
    Twisted-compatible inotify context.
    """

    def __init__(self, reactor=None):
        """
        Prepare the INotify context.
        """

        super().__init__(reactor=reactor)

        # Open the monitoring descriptor.
        self.fd = ffi.inotify_init1(ffi.IN_CLOEXEC | ffi.IN_NONBLOCK)

        # For `loseConnection` to call `connectionLost` on us.
        self.connected = 1
        self._writeDisconnected = True

        # Buffer for incoming messages.
        self.buffer = b''

        # Watch descriptors mapping to watch objects.
        self.watches = {}

    def fileno(self):
        """Get the inotify handle."""
        return self.fd

    def connectionLost(self, reason):
        """
        Release the inotify handle.
        """

        super().connectionLost(reason)

        try:
            ffi.close(self.fd)
        except OSError:
            log.msg('Failed to close inotify handle')

    def doRead(self):
        """Read some data from the kernel."""
        return fdesc.readFromFD(self.fd, self.onRead)

    def onRead(self, bstr):
        """
        Process just read data.
        """

        self.buffer += bstr

        while len(self.buffer) >= 16:
            wd, mask, cookie, size = unpack('=LLLL', self.buffer[:16])

            # Do we have the whole message?
            if len(self.buffer) < 16 + size:
                return

            name = self.buffer[16:16 + size].rstrip(b'\0')
            self.buffer = self.buffer[16 + size:]

            name = name.decode('utf8') or None

            if wd in self.watches:
                self.watches[wd].onEvent(mask, cookie, name)

    def watch(self, path, callback, mask=IN_ALL_EVENTS):
        """
        Start watching an object (or add to its mask).
        """

        path = realpath(path)
        wd = ffi.inotify_add_watch(self.fd, path.encode('utf8'), mask)

        if wd not in self.watches:
            self.watches[wd] = Watch(self, wd, path, callback)

        return self.watches[wd]

    def logPrefix(self):
        return 'inotify'


class Watch:
    """
    Watched object.
    """

    def __init__(self, inotify, wd, path, callback):
        self.callback = callback
        self.inotify = inotify
        self.path = path
        self.wd = wd

    def onEvent(self, mask, cookie, name):
        """
        Triggered on file system events.
        """

        flags = []
        for k, v in FLAG_TO_HUMAN:
            if k & mask:
                flags.append(v)

        event = flags.pop(0)
        kwargs = {flag: True for flag in flags}

        if cookie > 0:
            kwargs['cookie'] = cookie

        if name is not None:
            kwargs['name'] = name

        self.callback(event, watch=self, **kwargs)

    def ignore(self):
        """
        Stop watching the object.
        """

        if self.wd in self.inotify.watches:
            del self.inotify.watches[self.wd]
            ffi.inotify_rm_watch(self.inotify.fd, self.wd)


if __name__ == '__main__':
    from sys import stderr

    log.startLogging(stderr)

    inotify = INotify()
    inotify.watch('/tmp/indoktrinator', lambda *a, **kw: print(a, kw))
    reactor.callLater(0, inotify.startReading)
    reactor.run()


# vim:set sw=4 ts=4 et:
