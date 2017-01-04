#!/usr/bin/python3 -tt
# -*- coding: utf-8 -*-

from twisted.internet.task import LoopingCall
from twisted.internet import reactor
from twisted.python import log

from jsonschema import validate, ValidationError
from json import loads, dumps, JSONDecodeError
from uuid import uuid4
from time import time

from indoktrinator.model.device import Device
from indoktrinator.model.file import File
from indoktrinator.model.event import Event
from indoktrinator.model.item import Item
from indoktrinator.model.playlist import Playlist
from indoktrinator.model.program import Program
from indoktrinator.model.segment import Segment

from indoktrinator.utils import with_session
from indoktrinator.manager.schema import schema
from indoktrinator.manager.scheduler import *


__all__ = ['Manager']


class Manager:
    def __init__(self, db, notifier, router, media_path, url):
        # Save for later and also as a form of global context.
        self.db = db
        self.notifier = notifier
        self.router = router
        self.media_path = media_path
        self.url = url

        # Collection of devices we have come into contact with.
        self.devices = {}

        # Store for database objects received via notifications.
        self.store = Store()

        # Plans based on the store data.
        self.plans = {}

        # FIXME: Move these to site, we don't need them here.
        self.device = Device(self)
        self.file = File(self)
        self.event = Event(self)
        self.item = Item(self)
        self.playlist = Playlist(self)
        self.program = Program(self)
        self.segment = Segment(self)

    def start(self):
        log.msg('Starting manager...')

        # Listen to database notifications.
        self.notifier.listen('changelog', self.on_change)

        # Load tables from the database.
        self.store.init_from_db(self.db)

        # Apply what we have just loaded.
        self.apply_changes()

        log.msg('Manager started.')

    def on_message(self, message, sender):
        """
        A telescreen have sent us a message.
        """

        try:
            sender = sender.decode('utf8')
        except:
            log.msg('Invalid sender {!r}.'.format(sender))
            return

        try:
            validate(message, schema)
        except ValidationError:
            if isinstance(message, dict):
                log.msg('''
                    Invalid message received from {}, object type {!r}.
                '''.strip().format(sender, message.get('type')))
            else:
                log.msg('''
                    Invalid message received from {}, not an object.
                '''.strip().format(sender))

            return

        type_ = message['type']
        log.msg('Received {} message from {}...'.format(type_, sender))

        handler = 'on_{}_message'.format(type_)

        if hasattr(self, handler):
            getattr(self, handler)(message[type_], sender)
        else:
            log.msg('Missing handler for {} message.'.format(type_))

    def on_status_message(self, status, sender):
        """
        Status message tells us that a telescreen device is active.
        It is sent periodically, usually every 15 seconds.
        """

        # Update the runtime device information.
        status['last_seen'] = time()
        self.update_device(sender, status)

        # Send correct plan as needed.
        reactor.callLater(1e-6, self.sync_device, sender)

    def on_change(self, change):
        """
        A database table has changed.
        """

        # Parse change into individual fields.
        _txid, table, old, new = loads(change)

        # Update the store with the change.
        self.store.update_with_change(table, old, new)

        # FIXME: Delay applying any changes until things settle and we
        #        stop receiving new table changes for a while.
        self.apply_changes()

    def apply_changes(self):
        """
        Apply changes accumulated in the store.
        """

        for table, pkey, value in self.store.flush_dirty():
            handler = 'on_{}_change'.format(table)
            getattr(self, handler, lambda k, v: None)(pkey, value)

    def on_program_change(self, uuid, program):
        """
        Program or some of its dependencies have changed in the database.
        """

        if program is not None:
            log.msg('Program {name!r} ({uuid}) changed.'.format(**program))

            plan = make_plan(self.store, uuid)
            self.plans[uuid] = plan

        else:
            log.msg('Program {} deleted.'.format(uuid))

            if uuid in self.plans:
                self.plans.pop(uuid)

            plan = []

        for id, device in self.devices.items():
            if self.store.device.get(id, {}).get('program') == uuid:
                if device['plan'] != plan['id']:
                    self.send(id, 'plan', plan)

    def on_device_change(self, id, device):
        """Device has changed in the database."""
        self.sync_device(id)

    def sync_device(self, id):
        """
        Synchronize device plan if needed.
        """

        # Get runtime device status.
        status = self.devices.get(id)

        if status is None:
            # Device is currently disconnected.
            # Do not accumulate undeliverable messages.
            return

        # Find the persistent device record.
        device = self.store.device.get(id)

        if device is None:
            # Device is not configured.
            # Such devices have simply an empty plan.
            self.send(id, 'plan', EMPTY_PLAN)

            return

        # Find plan for device program.
        plan = self.plans[device['program']]

        # Check that device plan is up to date.
        if status['plan'] != plan['id']:
            # Device needs a new plan.
            self.send(id, 'plan', plan)

    def send(self, recipient, type_, payload):
        """
        Send standard message to the specified recipient.
        """

        log.msg('Send {} message to {}...'.format(type_, recipient))
        self.router.send({
            'id': uuid4().hex,
            'type': type_,
            type_: payload,
        }, recipient)

    def update_device(self, id, info):
        if id not in self.devices:
            log.msg('Add new device {}...'.format(id))

            self.devices[id] = {
                'id': id,
                'plan': EMPTY_PLAN['id'],
                'last_seen': 0,
                'power': False,
                'layout': {
                    'mode': 'full',
                    'panel': None,
                    'sidebar': None,
                },
            }

        self.devices[id].update(info)


# vim:set sw=4 ts=4 et:
