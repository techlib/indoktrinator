#!/usr/bin/python3 -tt
# -*- coding: utf-8 -*-

from twisted.internet.task import LoopingCall
from twisted.internet import reactor
from twisted.python import log

from txzmq import ZmqRouterConnection

from jsonschema import validate, ValidationError
from json import loads, dumps, JSONDecodeError
from uuid import uuid4

from indoktrinator.router.schema import schema
from indoktrinator.router.planner import Planner

from datetime import datetime
from time import time


__all__ = ['Router']


class Router(ZmqRouterConnection):
    def __init__(self, manager, factory, endpoint):
        super().__init__(factory, endpoint, identity=b'leader')

        self.manager = manager
        self.devices = {}

    def start(self):
        log.msg('Starting offline device check loop...')
        self.check_devices_loop = LoopingCall(self.check_devices)
        self.check_devices_loop.start(15)

        log.msg('Midnight!')
        self.midnight()

        log.msg('Router started.')

    def maybe_create_device(self, device_id, status):
        """
        Look up the device record or create a new one.
        """

        if device_id not in self.devices:
            try:
                # Device not in memory. Try to load it from the database.
                db_device = self.manager.device.get_item(device_id)

                self.devices[device_id] = {
                    'session': uuid4().hex,
                    'last_seen': time(),
                    'power': db_device['power'],
                }

            except:
                self.manager.device.insert({
                    'id': device_id,
                    'name': device_id,
                    'online': True,
                    'power': status['power'],
                })

                self.devices[device_id] = {
                    'session': uuid4().hex,
                    'last_seen': time(),
                    'power': status['power'],
                }

        return self.devices[device_id]

    def maybe_update_device(self, device_id, status):
        """
        Update device information both in memory and in the database.
        """

        # FIXME: We should not be saving online status in
        #        the database at all. Just create the device and
        #        let the UI take all info it needs from here.

        device = self.maybe_create_device(device_id, status)

        if device['power'] != status['power'] or device['last_seen'] + 300 < time():
            self.manager.device.update({
                'id': device_id,
                'online': True,
                'power': status['power'],
            })

        device.update({
            'session': status['session'],
            'last_seen': time(),
            'power': status['power'],
        })

    def check_devices(self):
        """
        Update devices in the database.
        """

        for db_device in self.manager.device.list():
            if db_device['online']:
                if db_device['id'] in self.devices:
                    device = self.devices[db_device['id']]
                    if device['last_seen'] + 300 >= time():
                        # The device record is still good.
                        continue

            self.manager.device.update({
                'id': db_device['id'],
                'online': False,
                'power': False,
            })

    def midnight(self):
        now = datetime.now()
        reactor.callLater(86400 - 3600*now.hour - 60*now.minute - now.second, self.midnight)

        if now.hour == 0 and now.minute == 0:
            for device_id in self.devices.keys():
                self.plan(device_id)

    def gotMessage(self, sender, bstr, ts):
        """
        Handle incoming message from a client.

        Validates the message against the `message-schema.yaml` and
        passes its contents to a correct method (called `on_<type>`).
        """

        try:
            message = loads(bstr.decode('utf8'))
            validate(message, schema)
        except JSONDecodeError:
            log.err('Invalid message received (cannot decode)')
            return
        except ValidationError as e:
            log.err('Invalid message received: {}'.format(repr(message)))
            return

        mtype = message['type']

        log.msg('Received {} message from {}...'.format(mtype, sender))
        handler = 'on_' + message['type']

        if hasattr(self, handler):
            payload = message.get(mtype, {})
            reactor.callLater(0, getattr(self, handler), payload, sender)
        else:
            log.err('Message {} not implemented.'.format(mtype))

    def send_message(self, device_id, type, payload):
        """
        Send message to specified client.
        """

        if isinstance(device_id, str):
            device_id = device_id.encode('utf8')

        ts = str(int(time())).encode('utf8')

        bstr = dumps({
            'id': uuid4().hex,
            'type': type,
            type: payload,
        }).encode('utf8')

        self.sendMultipart(device_id, [bstr, ts])

    def plan(self, device_id):
        """
        Calculate and send plan to a device.
        """

        plan = None
        program = None

        if not isinstance(device_id, str):
            device_id = device_id.decode('utf8')

        program = self.manager.db.session.query(
            self.manager.device.e().program
        ).filter_by(
            id=device_id
        ).one_or_none()

        if program is not None:
            planner = Planner(self.manager, program[0])
            plan = []

            for item in planner.plan:
                itype = 'unknown'

                if item[3] == 1:
                    itype = 'video'
                elif item[3] == 2:
                    itype = 'image'
                elif item[3] == 3:
                    itype = 'audiovideo'

                plan.append({
                    'start': item[1],
                    'end': item[2],
                    'type': itype,
                    'url': item[0],
                })

            self.send_message(device_id, 'plan', plan)

    def on_status(self, status, sender):
        """
        Client is still alive and reporting its status.

        This message gets usually sent about every 15 seconds from
        each device alive.
        """

        # Device identifier is a string, but 0MQ uses byte arrays.
        # The identifier is a hex-encoded number, so no big deal.
        device_id = sender.decode('utf8')

        # Look the device up in the memory, in the database and
        # possibly create it when not found. Does not update it.
        device = self.maybe_create_device(device_id, status)

        # If the device has been restarted, it probably does not have
        # the current plan. We should re-send it after we finish here.
        if status['session'] != device['session']:
            reactor.callLater(0, self.plan, device_id)

        # Update the device status both in memory and in the database.
        # Since update is not usually required, it is frequently skipped.
        self.maybe_update_device(device_id, status)

        # FIXME: Changing the resolution should be part of the plan,
        #        not an additional message that changes things post-ex.

        layout = status['layout']
        segment = self.manager.device.getResolution(device_id)

        if segment is not None:
            cur = (layout['mode'], layout.get('sidebar'), layout.get('panel'))
            new = (segment.mode, segment.sidebar, segment.panel)

            if cur != new:
                self.send_message(device_id, 'layout', {
                    'mode': segment.mode,
                    'sidebar': segment.sidebar,
                    'panel': segment.panel,
                })

# vim:set sw=4 ts=4 et:
