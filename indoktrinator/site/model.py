#!/usr/bin/python3 -tt
# -*- coding: utf-8 -*-

from sqlalchemy.orm import class_mapper


__all__ = ['Model']


class Table:
    NAME = None
    PKEY = 'uuid'
    RELS = []

    def __init__(self, db):
        self.db = db
        self.table = getattr(db, self.NAME)

        for (key, other_table) in self.RELS:
            self.table.relate(key, getattr(db, other_table))

        self.safe_cols = {col.name for col in self.table._table.columns}

    def get(self, key):
        obj = self.table.get(key)

        if obj is None:
            raise KeyError(key)

        return dbdict(obj)

    def insert(self, value):
        obj = self.table.insert(value)

        for key in value:
            if key not in self.safe_cols:
                raise ValueError(value)

        if self.PKEY in value:
            raise ValueError(value)

        self.db.flush()
        return dbdict(obj)

    def update(self, key, value):
        obj = self.table.get(key)

        if obj is None:
            raise KeyError(key)

        for name in value:
            while name not in self.safe_cols:
                raise ValueError(value)

        if value.get(self.PKEY) != getattr(obj, self.PKEY):
            raise ValueError(value)

        for (name, field) in value.items():
            setattr(obj, name, field)

        self.db.flush()
        return dbdict(obj)

    def delete(self, key):
        obj = self.table.get(key)

        if obj is None:
            raise KeyError(key)

        obj.delete()
        self.db.flush()
        return key

    def list(self, filter_by={}, order_by=[]):
        objs = self.table.filter_by(**filter_by).order_by(*order_by).all()
        results = []

        for obj in objs:
            results.append(dbdict(obj))

        return results


class Device(Table):
    NAME = 'device'
    PKEY = 'id'
    RELS = [('_program', 'program')]


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
        self.safe_cols.discard('system')
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


def dbdict(obj):
    """
    Convert an SQLAlchemy object to a dictionary.
    """

    mapper = class_mapper(obj.__class__)
    data = {col.key: getattr(obj, col.key) for col in mapper.columns}

    for (name, rel) in mapper.relationships.items():
        ref = getattr(obj, name)

        if ref is not None:
            data[name] = list(map(dbdict, ref)) if rel.uselist else dbdict(ref)

    return data


# vim:set sw=4 ts=4 et:
