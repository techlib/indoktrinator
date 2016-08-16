#!/usr/bin/python3 -tt
# -*- coding: utf-8 -*-

__all__ = ['Manager']

from twisted.internet.threads import deferToThread
from twisted.internet import task, reactor
from twisted.python import log

from indoktrinator.device import Device
from indoktrinator.event import Event
from indoktrinator.item import Item
from indoktrinator.playlist import Playlist
from indoktrinator.program import Program
from indoktrinator.segment import Segment

class Manager(object):
    def __init__(self, db):
        self.db = db

        # Something like models
        self.device = Device(self)
        self.event = Event(self)
        self.item = Item(self)
        self.playlist = Playlist(self)
        self.program = Program(self)
        self.segment = Segment(self)


# vim:set sw=4 ts=4 et:
