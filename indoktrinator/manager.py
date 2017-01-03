#!/usr/bin/python3 -tt
# -*- coding: utf-8 -*-

import os
import os.path

from twisted.internet.threads import deferToThread
from twisted.internet import task, reactor
from twisted.python import log, filepath

from indoktrinator.device import Device
from indoktrinator.file import File
from indoktrinator.event import Event
from indoktrinator.item import Item
from indoktrinator.playlist import Playlist
from indoktrinator.program import Program
from indoktrinator.segment import Segment


__all__ = ['Manager']


class Manager(object):
    def __init__(self, db, notifier, media_path, url):
        self.db = db
        self.notifier = notifier
        self.media_path = media_path
        self.url = url

        self.router = None

        # Something like models
        self.device = Device(self)
        self.file = File(self)
        self.event = Event(self)
        self.item = Item(self)
        self.playlist = Playlist(self)
        self.program = Program(self)
        self.segment = Segment(self)

# vim:set sw=4 ts=4 et:
