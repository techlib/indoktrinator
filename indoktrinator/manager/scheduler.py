#!/usr/bin/python3 -tt
# -*- coding: utf-8 -*-

from collections import Mapping

from indoktrinator.utils import with_session


__all__ = ['Store', 'make_plan', 'EMPTY_PLAN']


EMPTY_PLAN = {
    'id': '0' * 32,
    'items': [],
}


class Table (Mapping):
    def __init__(self, store):
        self.store = store
        self.rows = {}
        self.dirty = set()

    def values(self):
        return self.rows.values()

    def __getitem__(self, pkey):
        return self.rows[pkey]

    def __iter__(self):
        return iter(self.rows)

    def __len__(self):
        return len(self.rows)

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

        self.dirty.update(self.rows)

    def update_with_change(self, old, new):
        """
        Update row from a database change notification.
        """

        if old is not None:
            pkey = old.get('uuid') or old['id']
            self.dirty.add(pkey)

            if pkey in self.rows:
                self.rows.pop(pkey)

        if new is not None:
            pkey = new.get('uuid') or new['id']
            self.rows[pkey] = new
            self.dirty.add(pkey)


class Device (Table):
    pass


class Event (Table):
    pass


class File (Table):
    pass


class Item (Table):
    pass


class Playlist (Table):
    pass


class Program (Table):
    pass


class Segment (Table):
    pass


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


def make_plan(store, program_uuid):
    """
    Generate plan for selected program in the store.
    """

    # TODO: Implement plan generation.
    return EMPTY_PLAN


# vim:set sw=4 ts=4 et:
