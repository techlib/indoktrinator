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

from indoktrinator.utils import with_session


__all__ = ['Store', 'make_plan', 'EMPTY_PLAN']


EMPTY_PLAN = {
    'id': '0' * 32,
    'items': [],
    'layouts': [],
}

DEFAULT_LAYOUT = {
    'mode': 'full',
    'panel': None,
    'sidebar': None,
}


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


def make_plan(store, base_url, uuid):
    """
    Generate plan for selected program in the store.
    The plan goes at least 4 hours into the future.
    """

    log.msg('Create plan for program {}...'.format(uuid))

    # Do not continue unless the program actually exists.
    if uuid not in store.program:
        log.msg('New plan has {} items.'.format(len(EMPTY_PLAN['items'])))
        return EMPTY_PLAN

    # We are going to plan for the next 4 hours.
    # Some of these hours will be today and some may be tomorrow.
    now = datetime.now()
    today = now.date()
    tomorrow = today + timedelta(days=1)

    # Do not generate items outside the 4h time window.
    not_before = mktime(now.timetuple())
    not_after = not_before + 4 * 3600

    # Use the interval tree to decide what events override what segments.
    ptree = IntervalTree()

    # Use another tree to track screen layouts.
    ltree = IntervalTree()

    # Start with an interval covering the whole 4h window.
    ltree[not_before:not_after] = DEFAULT_LAYOUT

    for segment in store.segment.filter(program=uuid, day=today.weekday()):
        insert_segment(ptree, today, segment)
        insert_segment(ltree, today, segment)

    for segment in store.segment.filter(program=uuid, day=tomorrow.weekday()):
        insert_segment(ptree, tomorrow, segment)
        insert_segment(ltree, tomorrow, segment)

    # Ordered screen layouts.
    layouts = []

    # Generate layouts.
    for interval in sorted(ltree):
        if interval.end < not_before:
            continue

        if interval.begin > not_after:
            break

        layouts.append({
            'start': interval.begin,
            'end': interval.end,
            'mode': interval.data['mode'],
            'sidebar': interval.data['sidebar'],
            'panel': interval.data['panel'],
        })

    for event in store.event.filter(program=uuid, date=today):
        insert_segment(ptree, today, event)

    for event in store.event.filter(program=uuid, date=tomorrow):
        insert_segment(ptree, tomorrow, event)

    # Ordered playlist items.
    items = []

    # Generate items and layouts for all intervals.
    for interval in sorted(ptree):
        begin = interval.begin

        if interval.end < not_before:
            # Skip this interval, it is already in the past.
            continue

        if begin > not_after:
            # End here, no need to go that far in the future.
            break

        playlist = store.item.filter(playlist=interval.data['playlist'])

        for item in cycle(playlist):
            # Locate the file backing the item.
            file = store.file[item['file']]

            # NOTE: Do not allow items to have shorter than 1s duration
            #       or else we get stuck in this loop forever.
            duration = max(1.0, item['duration'])

            # Be careful not to exceed segment range.
            end = min(begin + duration, interval.end)

            if end >= not_before:
                # Insert the item only when it's in the future.
                items.append({
                    'start': begin,
                    'end': end,
                    'type': file['type'],
                    'url': base_url + '/' + file['path'],
                })

            # Update our current position.
            begin = end

            if begin >= interval.end or begin > not_after:
                # Advance to the next segment.
                break

    log.msg('''
        New plan has {} items and {} layouts.
    '''.strip().format(len(items), len(layouts)))

    return {
        'id': uuid4().hex,
        'items': items,
        'layouts': layouts,
    }


def insert_segment(tree, day, segment):
    begin, end = segment['range']

    tbegin = daytime(day, begin)
    tend = daytime(day, end)

    # Sometimes this might not hold due to a time zone shift.
    if tend > tbegin:
        tree.chop(tbegin, tend)
        tree[tbegin:tend] = segment


def daytime(day, seconds):
    cal = datetime.combine(day, time()) + timedelta(seconds=seconds)
    return mktime(cal.timetuple())


def from_range(text):
    return tuple(map(int, findall(r'\d+', text)))


# vim:set sw=4 ts=4 et:
