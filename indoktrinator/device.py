#!/usr/bin/python3 -tt
# -*- coding: utf-8 -*-

from indoktrinator.model import Model
from indoktrinator.utils import object_to_dict
from sqlalchemy import and_

__all__ = ['Device']


class Device(Model):
    def init(self):
        self.table_name = 'device'
        # Primary key
        self.pkey = 'id'
        # Relations
        self.relate('_program', self.e('program'))
        self.include_relations = {'item': ['_program'], 'list': ['_program']}

    def uuidByFile(self, uuid):
        '''
        Not needed
        '''
        return self.manager.db.session.query(
            self.e('device'),
        ).join(
            self.e('program'),
        ).join(
            self.e('segment'),
        ).join(
            self.e('event')
        ).join(
            self.e('playlist')
        ).join(
            self.e('item')
        ).join(
            self.e('file')
        ).filter(self.e('file').uuid == uuid).all()

    def uuidByItem(self, uuid):
        return self.manager.db.session.query(
            self.e('device'),
        ).join(
            self.e('program'),
        ).join(
            self.e('segment'),
        ).join(
            self.e('event')
        ).join(
            self.e('playlist')
        ).join(
            self.e('item')
        ).filter(self.e('item').uuid == uuid).all()

    def uuidByPlaylist(self, uuid):
        return self.manager.db.session.query(
            self.e('device'),
        ).join(
            self.e('program'),
        ).join(
            self.e('segment'),
        ).join(
            self.e('event')
        ).join(
            self.e('playlist')
        ).filter(self.e('playlist').uuid == uuid).all()

    def uuidBySegment(self, uuid):
        return self.manager.db.session.query(
            self.e('device'),
        ).join(
            self.e('program'),
        ).join(
            self.e('segment'),
        ).filter(self.e('segment').uuid == uuid).all()

    def uuidByEvent(self, uuid):
        return self.manager.db.session.query(
            self.e('device'),
        ).join(
            self.e('program'),
        ).join(
            self.e('event')
        ).filter(self.e('playlist').uuid == uuid).all()

# vim:set sw=4 ts=4 et:
