#!/usr/bin/python3 -tt
# -*- coding: utf-8 -*-

from sqlalchemy.orm import class_mapper
from urllib.parse import urljoin


__all__ = ['Model']


class Table:
    NAME = None
    PKEY = 'uuid'
    RELS = []

    # Do not allow primary key modifications or custom value on insert.
    # This is the default since we have mostly `uuid` primary keys.
    PROTECTED_PKEY = True

    def __init__(self, db):
        self.db = db
        self.table = getattr(db, self.NAME)

        for (key, other_table) in self.RELS:
            self.table.relate(key, getattr(db, other_table))

        self.safe_cols = {col.name for col in self.table._table.columns}

        # Fox the `dbdict` function.
        self.table._table.fixup = self.fixup

    def get(self, key, depth=0):
        obj = self.table.get(key)

        if obj is None:
            raise KeyError(key)

        return dbdict(obj, depth)

    def insert(self, value, depth=0):
        obj = self.table.insert(**value)

        for key in value:
            if key not in self.safe_cols:
                raise ValueError(value)

        if self.PROTECTED_PKEY:
            if self.PKEY in value:
                raise ValueError(value)

        self.db.flush()
        return dbdict(obj, depth)

    def update(self, key, value, depth=0):
        obj = self.table.get(key)

        if obj is None:
            raise KeyError(key)

        for name in value:
            while name not in self.safe_cols:
                raise ValueError(value)

        if self.PROTECTED_PKEY:
            if value.get(self.PKEY) != getattr(obj, self.PKEY):
                raise ValueError(value)

        for (name, field) in value.items():
            setattr(obj, name, field)

        self.db.flush()
        return dbdict(obj, depth)

    def delete(self, key):
        obj = self.table.get(key)

        if obj is None:
            raise KeyError(key)

        self.db.delete(obj)
        self.db.flush()
        return key

    def list(self, filter_by={}, order_by=[], depth=0):
        objs = self.table.filter_by(**filter_by).order_by(*order_by).all()
        results = []

        for obj in objs:
            results.append(dbdict(obj, depth))

        return results

    def fixup(self, data):
        return data


class Device(Table):
    NAME = 'device'
    PKEY = 'id'
    RELS = [('_program', 'program')]

    # Devices have mutable primary keys.
    PROTECTED_PKEY = False

    def fixup(self, data):
        data['photo'] = urljoin('/api/preview-image/device', data['id'])
        return data


class Event(Table):
    NAME = 'event'
    RELS = [('_playlist', 'playlist')]


class File(Table):
    NAME = 'file'

    def __init__(self, db):
        super().__init__(db)

        # Do not allow changes to columns administered
        # by the harvester or database triggers.
        self.safe_cols.clear()

    def fixup(self, data):
        data['preview'] = urljoin('/api/preview-image/file', data['uuid'])
        return data


class Item(Table):
    NAME = 'item'
    RELS = [('_file', 'file')]

    def __init__(self, db):
        super().__init__(db)

        # Do not allow changes to columns administered
        # by the harvester or database triggers.
        self.safe_cols.discard('file')
        self.safe_cols.discard('playlist')


class Playlist(Table):
    NAME = 'playlist'
    RELS = [('items', 'item')]

    def __init__(self, db):
        super().__init__(db)

        # Do not allow changes to columns administered
        # by the harvester or database triggers.
        self.safe_cols.discard('path')
        self.safe_cols.discard('token')
        self.safe_cols.discard('duration')


class Program(Table):
    NAME = 'program'
    RELS = [('segments', 'segment')]


class Segment(Table):
    NAME = 'segment'
    RELS = [('_playlist', 'playlist')]


class Model:
    TABLES = [Device, Event, File, Item, Playlist, Program, Segment]

    def __init__(self, db):
        self.db = db

        for table in self.TABLES:
            setattr(self, table.NAME, table(db))


def dbdict(obj, depth=0):
    """
    Convert an SQLAlchemy object to a dictionary.
    """

    fixup = obj._table.fixup
    mapper = class_mapper(obj.__class__)
    data = {col.key: getattr(obj, col.key) for col in mapper.columns}

    if depth == 0:
        return fixup(data)

    for (name, rel) in mapper.relationships.items():
        ref = getattr(obj, name)

        if ref is not None:
            if rel.uselist:
                data[name] = [dbdict(item, depth - 1) for item in ref]
            else:
                data[name] = dbdict(ref, depth - 1)

    return fixup(data)


# vim:set sw=4 ts=4 et:
