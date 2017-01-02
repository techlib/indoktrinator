#!/usr/bin/python3 -tt
# -*- coding: utf-8 -*-

from ctypes import cdll, Structure, c_int, c_char_p, c_uint32, get_errno


# Fcntl-like flags for inotify_init1.
IN_CLOEXEC       = 0x00080000  # Close upon execve(2).
IN_NONBLOCK      = 0x00000800  # Do not block.


def make_error_check(msg):
    def check_result(result, func, args):
        if result < 0:
            raise OSError(get_errno(), msg)
        return result
    return check_result


libc = cdll.LoadLibrary('libc.so.6')

inotify_init1 = libc.inotify_init1
inotify_init1.argtypes = (c_int,)
inotify_init1.restype = c_int
inotify_init1.errcheck = make_error_check('Failed to init inotify')

inotify_add_watch = libc.inotify_add_watch
inotify_add_watch.argtypes = (c_int, c_char_p, c_uint32)
inotify_add_watch.restype = c_int
inotify_add_watch.errcheck = make_error_check('Failed to add watch')

inotify_rm_watch = libc.inotify_rm_watch
inotify_rm_watch.argtypes = (c_int, c_int)
inotify_rm_watch.restype = c_int
inotify_rm_watch.errcheck = make_error_check('Failed to remove watch')

close = libc.close
close.argtypes = (c_int,)
close.restype = c_int
close.errcheck = make_error_check('Failed to close inotify handle')

# vim:set sw=4 ts=4 et:
