#!/usr/bin/python3 -tt
# -*- coding: utf-8 -*-

from twisted.python import log

from itertools import cycle
from collections import Mapping
from intervaltree import IntervalTree, Interval

from datetime import datetime, timedelta, time
from time import mktime

from re import findall
from uuid import uuid4


__all__ = ['Store']


class Table (Mapping):
    def __init__(self, store):
        self.store = store
        self.rows = {}
        self.dirty = set()

    def values(self):
        return self.rows.values()

    def filter(self, **filters):
        """
        Returns values whose fields match specified parameters.
        """

        def matching(value):
            for key, flt in filters.items():
                if value[key] != flt:
                    return False

            return True

        return filter(matching, self.values())

    def mark_dirty(self, pkey):
        """Mark this and all parent rows dirty."""
        self.dirty.add(pkey)

    def init_from_table(self, table):
        """
        Clear and re-read all rows from the database.
        """

        self.rows.clear()

        for row in table.all():
            pkey = getattr(row, 'uuid', None) or getattr(row, 'id')
            self.rows[pkey] = {}

            for key, value in row.__dict__.items():
                if not key.startswith('_'):
                    self.rows[pkey][key] = value

        for pkey in self.rows:
            self.mark_dirty(pkey)

    def update_with_change(self, old, new):
        """
        Update row from a database change notification.
        """

        if old is not None:
            pkey = old.get('uuid') or old['id']
            self.mark_dirty(pkey)

            if pkey in self.rows:
                self.rows.pop(pkey)

        if new is not None:
            pkey = new.get('uuid') or new['id']
            self.rows[pkey] = new
            self.mark_dirty(pkey)

    def __getitem__(self, pkey):
        return self.rows[pkey]

    def __iter__(self):
        return iter(self.rows)

    def __len__(self):
        return len(self.rows)


class Device (Table):
    pass


class Program (Table):
    pass


class Segment (Table):
    def mark_dirty(self, pkey):
        super().mark_dirty(pkey)

        segment = self.get(pkey)
        if segment is not None:
            self.store.program.mark_dirty(segment['program'])

    def update_with_change(self, old, new):
        if old is not None:
            old['range'] = from_range(old['range'])

        if new is not None:
            new['range'] = from_range(new['range'])

        return super().update_with_change(old, new)


class Event (Table):
    def mark_dirty(self, pkey):
        super().mark_dirty(pkey)

        event = self.get(pkey)
        if event is not None:
            self.store.program.mark_dirty(event['program'])

    def update_with_change(self, old, new):
        if old is not None:
            old['range'] = from_range(old['range'])

        if new is not None:
            new['range'] = from_range(new['range'])

        return super().update_with_change(old, new)


class Playlist (Table):
    def mark_dirty(self, pkey):
        super().mark_dirty(pkey)

        playlist = self.get(pkey)
        if playlist is not None:
            for segment in self.store.segment.filter(playlist=pkey):
                self.store.segment.mark_dirty(segment['uuid'])

            for event in self.store.event.filter(playlist=pkey):
                self.store.event.mark_dirty(event['uuid'])


class Item (Table):
    def mark_dirty(self, pkey):
        super().mark_dirty(pkey)

        item = self.get(pkey)
        if item is not None:
            self.store.playlist.mark_dirty(item['playlist'])


class File (Table):
    def mark_dirty(self, pkey):
        super().mark_dirty(pkey)

        file = self.get(pkey)
        if file is not None:
            for item in self.store.item.filter(file=pkey):
                self.store.item.mark_dirty(item['uuid'])


class Store (Mapping):
    def __init__(self):
        self.tables = {
            'device': Device(self),
            'event': Event(self),
            'file': File(self),
            'item': Item(self),
            'playlist': Playlist(self),
            'program': Program(self),
            'segment': Segment(self),
        }

        for name, table in self.tables.items():
            setattr(self, name, table)

    def init_from_db(self, db):
        """
        Initialize rows from the database.
        """

        with db.session.begin():
            for name, table in self.tables.items():
                table.init_from_table(getattr(db, name))

    def update_with_change(self, table, old, new):
        """Update rows from a database change notification."""
        self.tables[table].update_with_change(old, new)

    def flush_dirty(self):
        """
        Iterate over all dirty rows and discard them afterwards.
        The iterator produces ``(table_name, row_key, row_data)`` tuples.
        """

        for name, table in self.tables.items():
            for pkey in table.dirty:
                yield (name, pkey, table.get(pkey))

            table.dirty.clear()

    def __getitem__(self, key):
        return self.tables[key]

    def __iter__(self):
        return iter(self.tables)

    def __len__(self):
        return len(self.tables)


def from_range(text):
    return tuple(map(int, findall(r'\d+', text)))


# vim:set sw=4 ts=4 et:
