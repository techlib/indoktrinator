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

from indoktrinator.db import with_session


__all__ = ['make_plan', 'EMPTY_PLAN']


EMPTY_PLAN = {
    'id': '0' * 32,
    'items': [],
    'layouts': [],
    'power': [{'start': 0, 'end': 86400, 'power': 'standby'}]
}

DEFAULT_LAYOUT = {
    'mode': 'full',
    'panel': None,
    'sidebar': None,
}


def make_plan(store, base_url, uuid,
              power_up_before=60,
              power_down_after=60,
              power_down_gap=600):
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

    # And another tree to track device power
    pwrtree = IntervalTree()

    # Start with an interval covering the whole 4h window.
    ltree[not_before:not_after] = DEFAULT_LAYOUT

    # Assume off is default
    pwrtree[not_before:not_after] = 'standby'

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

    for event in store.event.filter(program=uuid, date=today.isoformat()):
        insert_segment(ptree, today, event)

    for event in store.event.filter(program=uuid, date=tomorrow.isoformat()):
        insert_segment(ptree, tomorrow, event)

    # Ordered playlist items.
    items = []

    # Generate items for all intervals.
    for interval in sorted(ptree):
        begin = interval.begin

        if interval.end < not_before:
            # Skip this interval, it is already in the past.
            continue

        if begin > not_after:
            # End here, no need to go that far in the future.
            break

        playlist = store.item.filter(playlist=interval.data['playlist'])
        playlist = sorted(playlist, key=lambda item: item['position'])

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
                    'url': base_url + '/' + file['path'] \
                           if file['stream_url'] is None \
                           else file['stream_url'],
                })

            # Update our current position.
            begin = end

            if begin >= interval.end or begin > not_after:
                # Advance to the next segment.
                break

    power = []

    # Set power intervals
    for interval in sorted(ptree):

        if interval.end < not_before:
            continue

        if interval.begin > not_after:
            break

        # Power the device up a few seconds ahead to let it warm up.
        begin = interval.begin - power_up_before

        # Power the device down a few seconds after the segment ends.
        end = interval.end + power_down_after

        pwrtree.chop(begin, end)
        pwrtree[begin:end] = 'on'

    for interval in sorted(pwrtree):
        duration = interval.end - interval.begin

        state = interval.data

        # Do not turn the device off for gaps shorter than a certain
        # minimum to limit equipment wear and improve user experience.
        if state == 'standby' and duration < power_down_gap:
            state = 'on'

        power.append({
            'start': interval.begin,
            'end': interval.end,
            'power': state
        })

    log.msg('''
        New plan has {} items and {} layouts.
    '''.strip().format(len(items), len(layouts)))

    return {
        'id': uuid4().hex,
        'items': items,
        'layouts': layouts,
        'power': power,
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


# vim:set sw=4 ts=4 et:
