#!/usr/bin/python3 -tt
# -*- coding: utf-8 -*-

from indoktrinator.inotifier.inotifier import Inotifier


def make_inotifier(db, manager, path, inotifier_timeout, **kwargs):
    inotifier = Inotifier(db, manager, path, inotifier_timeout, **kwargs)
    return inotifier

# vim:set sw=4 ts=4 et:
