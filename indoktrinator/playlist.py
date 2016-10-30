#!/usr/bin/python3 -tt
# -*- coding: utf-8 -*-

from indoktrinator.model import Model
from indoktrinator.utils import object_to_dict
from sqlalchemy import and_

__all__ = ['Playlist']


class Playlist(Model):
    def init(self):
        self.table_name = 'playlist'
        # Primary key
        self.pkey = 'uuid'
        # Relations
        self.relate('items', self.e('item'))
        self.include_relations = {'item': ['items', 'item__file'], 'list': ['items']}

# vim:set sw=4 ts=4 et:
