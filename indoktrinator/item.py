#!/usr/bin/python3 -tt
# -*- coding: utf-8 -*-

from indoktrinator.model import Model
from indoktrinator.utils import object_to_dict
from sqlalchemy import and_

__all__ = ['Item']


class Item(Model):
    def init(self):
        self.table_name = 'item'
        # Primary key
        self.pkey = 'uuid'
        # Relations
        self.relate('_file', self.e('file'))
        self.include_relations = {'item': ['_file'], 'list': ['_file']}

# vim:set sw=4 ts=4 et:
