#!/usr/bin/python3 -tt
# -*- coding: utf-8 -*-

from indoktrinator.utils import object_to_dict, with_session
from sqlalchemy.orm import class_mapper


__all__ = ['Model']


class Model(object):
    # Table details.
    TABLE  = None
    SCHEMA = 'public'
    PKEY   = 'id'

    # Include relations for list view and single item view.
    INCLUDE_ITEM = []
    INCLUDE_LIST = []

    def __init__(self, manager):
        # Save for later.
        self.manager = manager
        self.db = manager.db

    def list(self, order_by=[], filter={}, fields=[], exclude=[]):
        # TODO: better to filter on db query

        items = []

        query = self.e()

        if order_by:
            query = query.order_by(*order_by)
        else:
            query = query.order_by(self.PKEY)

        if filter:
            query = query.filter_by(**filter)
        else:
            query = query.all()

        for item in query:
            item = object_to_dict(item, include=self.INCLUDE_LIST)
            items.append({
                key: value for key, value in item.items()
                if (not fields or key in fields) and key not in exclude
            })

        return items

    def get_item(self, key):
        item = self.e().filter_by(**{self.PKEY: key}).one()
        item = object_to_dict(item, include=self.INCLUDE_ITEM)
        return item

    @with_session
    def update(self, item):
        key = item.get(self.PKEY)
        assert key is not None, 'Primary key is not set'

        entity = self.e().filter_by(**{self.PKEY: key}).one()

        for k, v in item.items():
            if k in self.get_relationships() or k == self.PKEY:
                continue

            setattr(entity, k, v)

        return object_to_dict(entity)

    @with_session
    def replace(self, item):
        if item.get(self.PKEY) is not None:
            key = item.get(self.PKEY)
            self.e().filter_by(**{self.pkey: PKEY}).delete()

        return object_to_dict(self.insert(item))

    @with_session
    def insert(self, item):
        new = {}

        for k, v in item.items():
            if k not in self.get_relationships() and v is not None:
                new[k] = v

        entity = self.e().insert(**new)
        return object_to_dict(entity)

    @with_session
    def delete(self, key):
        return {
            'deleted': self.e().filter_by(**{self.PKEY: key}).delete(),
        }

    def e(self, table_name=None):
        """ Returns this models SQLSoup entity """
        return self.db.entity(table_name or self.TABLE, self.SCHEMA)

    def relate(self, name, entity):
        return self.e().relate(name, entity)

    def get_relationships(self):
        mapper = class_mapper(self.e())
        return mapper.relationships.keys()

# vim:set sw=4 ts=4 et:
