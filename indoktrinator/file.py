#!/usr/bin/python3 -tt
# -*- coding: utf-8 -*-

from indoktrinator.model import Model
from indoktrinator.utils import object_to_dict
from sqlalchemy import and_

__all__ = ['File']


class File(Model):
    def init(self):
        self.table_name = 'file'
        # Primary key
        self.pkey = 'uuid'
        # Relations

    def changed(self, key):
        for item in self.manager.device.uuidByFile(key):
            device = item.id.encode('utf8')
            self.manager.inotifier.addDevice(device)

# vim:set sw=4 ts=4 et:
