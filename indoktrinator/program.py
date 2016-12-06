#!/usr/bin/python3 -tt
# -*- coding: utf-8 -*-

from indoktrinator.model import Model
from indoktrinator.utils import object_to_dict
from sqlalchemy import and_

__all__ = ['Program']


class Program(Model):
    def init(self):
        self.table_name = 'program'
        # Primary key
        self.pkey = 'uuid'
        # Relations
        self.include_relations = {'item': [], 'list': []}

    def changed(self, key):
        for item in self.manager.device.uuidByProgram(key):
            device = item.id.encode('utf8')
            self.manager.inotifier.addDevice(device)

# vim:set sw=4 ts=4 et:
