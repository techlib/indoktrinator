#!/usr/bin/python3 -tt
# -*- coding: utf-8 -*-

from txpostgres import txpostgres
from twisted.internet import defer

__all__ = ['Notifier']

class Notifier(object):

    def __init__(self, reactor, db):
        self.db = txpostgres.Connection(reactor=reactor)
        self.conn = self.db.connect(db)

    def addCallback(self, callback, channel):
        def listen(_):
            self.db.runOperation('listen {channel}'.format(channel=channel))
        self.conn.addCallback(listen);
        self.db.addNotifyObserver(callback)

# vim:set sw=4 ts=4 et:
