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

# vim:set sw=4 ts=4 et:
