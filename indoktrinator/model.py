#!/usr/bin/python3 -tt
# -*- coding: utf-8 -*-

from indoktrinator.utils import object_to_dict
from sqlalchemy.orm import class_mapper

__all__ = ['Model']


class Model(object):
    def __init__(self, manager):
        # Stores DB connection for later use.
        self.manager = manager
        self.db = manager.db
        # Include relations for list view and single item view
        self.include_relations = {'item': [], 'list': []}
        # Pkey
        self.pkey = 'id'
        # Default schema
        self.schema = 'public'
        # Call customized init
        self.init()

    def init(self):
        pass

    def list(self, order_by=[], filter={}, fields=[], exclude=[]):
        '''
        '''

        # TODO: better to filter on db query

        items = []

        query = self.e()

        if order_by:
            query = query.order_by(*order_by)
        else:
            query = query.order_by(self.pkey)

        if filter:
            query = query.filter_by(**filter)
        else:
            query = query.all()

        for item in query:
            item = object_to_dict(
                item,
                include=self.include_relations.get('list')
            )
            items.append({
                key: value for key, value in item.items()
                if (not fields or key in fields) and key not in exclude
            })
        return items

    def get_item(self, key):
        item = self.e().filter_by(**{self.pkey: key}).one()
        item = object_to_dict(item, include=self.include_relations.get('item'))
        return item

    def update(self, item):
        assert item.get(self.pkey) is not None, 'Primary key is not set'
        key = item.get(self.pkey)
        entity = self.e().filter_by(**{self.pkey: key}).one()
        for k, v in item.items():
            if k in self.get_relationships() or k == self.pkey:
                continue
            setattr(entity, k, v)
        self.db.commit()
        self.changed(key)
        return object_to_dict(entity)

    def replace(self, item):
        if item.get(self.pkey) is not None:
            key = item.get(self.pkey)
            self.e().filter_by(**{self.pkey: key}).delete()
            self.changed(key)
        return object_to_dict(self.insert(item))

    def insert(self, item):
        newVal = {}
        for k, v in item.items():
            if k not in self.get_relationships() and v is not None:
                newVal[k] = v
        e = self.e().insert(**newVal)
        self.db.commit()
        key = getattr(e, self.pkey)
        print(key)
        self.changed(key)
        return object_to_dict(e)

    def delete(self, key):
        rows = self.e().filter_by(**{self.pkey: key}).delete()
        self.db.commit()
        self.changed(key)
        return {'deleted': rows}

    def e(self, table_name=None):
        """ Returns this models SQLSoup entity """
        if table_name is None:
            table_name = self.table_name
        return self.db.entity(table_name, self.schema)

    def relate(self, name, entity):
        return self.e().relate(name, entity)

    def get_relationships(self):
        mapper = class_mapper(self.e())
        return mapper.relationships.keys()

    def changed(self, key):
        pass

# vim:set sw=4 ts=4 et:
