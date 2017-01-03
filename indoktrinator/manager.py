#!/usr/bin/python3 -tt
# -*- coding: utf-8 -*-

from twisted.python import log

from indoktrinator.model.device import Device
from indoktrinator.model.file import File
from indoktrinator.model.event import Event
from indoktrinator.model.item import Item
from indoktrinator.model.playlist import Playlist
from indoktrinator.model.program import Program
from indoktrinator.model.segment import Segment


__all__ = ['Manager']


class Manager:
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
