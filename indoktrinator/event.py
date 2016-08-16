#!/usr/bin/python3 -tt
# -*- coding: utf-8 -*-

from indoktrinator.model import Model
from indoktrinator.utils import object_to_dict
from sqlalchemy import and_

__all__ = ['Event']

class Event(Model):
    def init(self):
        self.table_name = 'event'
        # Primary key
        self.pkey = 'uuid'
        # Relations
        self.relate('_program', self.e('program'))
        self.relate('_playlist', self.e('playlist'))
        self.include_relations = {'item': ['_program', '_playlist'],
                                  'list': ['_program', '_playlist']}

# vim:set sw=4 ts=4 et:
