# -*- coding: utf-8 -*-
import sys
import traceback
import datetime
import time
from twisted.internet import reactor
from twisted.python import log
from txzmq import ZmqRouterConnection

from json import loads, dumps
from jsonschema import validate

from indoktrinator.router.schema import schema
from uuid import uuid4

from indoktrinator.router.planner import Planner


class Router(ZmqRouterConnection):
    '''
    Router class implement communication with device
    '''
    MESSAGE_COUNT = 0
    CLIENT_DICT = {}
    CALLBACK_REGISTER = {}

    def __init__(self, db, manager, factory, endpoint):
        '''
        Construtor for router endpoint

        '''
        self.db = db
        self.manager = manager
        for device in self.manager.device.list():
            Router.CLIENT_DICT[device['id']] = {
                'id': device['id'],
                'date': datetime.datetime.now(),
                'online': device['online'],
                'power': device['power'],
                'messages': {},
                'db': True,
            }

        super(Router, self).__init__(factory, endpoint, identity=b'leader')

    def getClient(self, id_device):
        '''
        Get client from connected clients
        '''
        id_device_str = id_device.decode('utf8')

        if id_device_str not in Router.CLIENT_DICT:
            Router.CLIENT_DICT[id_device_str] = {
                'id': id_device_str,
                'date': datetime.datetime.now(),
                'online': False,
                'power': False,
                'messages': {},
                'db': False,
            }

        return Router.CLIENT_DICT[id_device_str]

    def updateClient(self, id_device):
        '''
        If client send some message, update current information
        '''
        client = self.getClient(id_device)

        if client['online'] is not True:
            client['online'] = True

            if client['db']:
                self.manager.device.update({
                    'id': client['id'],
                    'online': True,
                    'power': True,
                })
            else:
                self.manager.device.insert({
                    'id': client['id'],
                    'name': client['id'],
                    'online': True,
                    'power': True,
                })

        client['date'] = datetime.datetime.now()

    def checkClients(self):
        '''
        Check client connection status and save
        '''
        now = datetime.datetime.now()

        for client_id, client in Router.CLIENT_DICT.items():
            diff = now - client['date']
            if diff.seconds > 300:
                self.manager.device.update({
                    'id': client_id,
                    'online': False,
                    'power': False,
                })

        reactor.callLater(5, self.checkClients)

    def midnight(self):
        now = datetime.datetime.now()
        reactor.callLater(86400 - 3600*now.hour - 60*now.minute - now.second, self.midnight)

        if now.hour == 0 and now.minute == 0:
            for device_id in Router.CLIENT_DICT.keys():
                self.plan(device_id)

    def gotMessage(self, id_device, raw, timestamp):
        '''
        Receive message from client and call coresponding method
        Use internal callback register
        '''

        Router.MESSAGE_COUNT += 1
        self.updateClient(id_device)

        try:
            message = loads(raw.decode('utf8'))
            validate(message, schema)

            if 'type' in message \
                    and message['type'] in Router.CALLBACK_REGISTER:
                for method in Router.CALLBACK_REGISTER[message['type']]:
                    method(id_device, message)
        except Exception as e:
            '''
            Log exception
            '''
            log.err()

    def sendMsg(self, id_device, type, message, id=None):
        '''
        Send message to client
        '''
        if isinstance(id_device, str):
            id_device = id_device.encode('utf8')

        message['type'] = type
        message['id'] = id or str(uuid4())
        raw = dumps(message).encode('utf8')
        timestamp = str(int(time.time())).encode('utf8')

        data = [raw, timestamp]

        self.sendMultipart(
            id_device,
            data
        )
        return message['id']

    def registerCallback(self, action, method):
        '''
        Register action to received messages
        '''
        if action not in Router.CALLBACK_REGISTER:
            Router.CALLBACK_REGISTER[action] = []

        Router.CALLBACK_REGISTER[action].append(method)

    def unregisterCallback(self, action, method):
        '''
        Unregister action to received messages
        '''
        if action in Router.CALLBACK_REGISTER \
                and method in Router.CALLBACK_REGISTER[action]:
            Router.CALLBACK_REGISTER[action].remove(method)

    def plan(self, device_id):
        '''
        Send plan to the device
        '''
        program = None
        plan = None
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
                type = 'unknown'
                if item[3] == 1:
                    type = 'video'
                elif item[3] == 2:
                    type = 'image'
                elif item[3] == 3:
                    type = 'audiovideo'

                plan.append({
                    'start': item[1],
                    'end': item[2],
                    'type': type,
                    'uri': item[0],
                })

            self.sendMsg(device_id, 'plan', {'plan': plan})

    def powerOff(self, id_device):
        '''
        Power of device
        '''
        self.sendMsg(id_device, 'powerOff', {})

    def powerOn(self, id_device):
        '''
        PowerOn device
        '''
        self.sendMsg(id_device, 'powerOff', {})

    def play(self, id_device, type, url):
        '''
        Play url on device
        '''
        self.sendMsg(id_device, 'play', {'play': {'uri': url, 'type': type}})

    def stop(self, id_device):
        '''
        stop playing on device
        '''
        pass

    def resolution(self, id_device, type, url1=None, url2=None):
        '''
        set resolution on device
        '''
        msg = {'type': type}
        if url1:
            msg['urlRight'] = url1

        if url2:
            msg['urlBottom'] = url2

        self.sendMsg(id_device, 'resolution', {'resolution': msg})

    def url(self, id_device, url1=None, url2=None):
        '''
        Set url mode for device
        '''
        message = {}
        if url1:
            message['urlRight'] = url1

        if url2:
            message['urlBottom'] = url2

        self.sendMsg(id_device, 'url', message)

    def on_init(self, id_device, message):
        '''
        Callback on init message
        '''
        id_device_str = id_device.decode('utf8')
        try:
            device = self.manager.device.get_item(id_device_str)
        except:
            device = self.manager.device.insert({
                'id': id_device_str,
                'name': id_device_str,
            })

        self.plan(id_device)

    def on_status(self, id_device, message):
        '''
        Periodical report from client
        '''

        client = self.getClient(id_device)

        # Begin temporary hack
        #
        # Protocol is being reworked and the 'init' message is going away.
        # This makes sure that 'status' will trigger DB write and the device
        # gets its initial schedule without a special message type.
        #
        # Still, the logic is broken because it won't get the problem after
        # reconnect. A session id or something similar is needed to do that.
        #

        if not client['db']:
            self.on_init(id_device, message)

        if not client.get('has_plan'):
            client['has_plan'] = True
            self.plan(id_device)

        #
        # End temporary hack

        device = {'id': client['id']}
        update = False
        if client['online'] is not True:
            client['online'] = True
            device['online'] = True
            update = True

        if client['power'] != message['status']['power']:
            device['power'] = message['status']['power']
            client['power'] = message['status']['power']
            update = True

        if update:
            self.manager.device.update(device)

        segment = self.manager.device.getResolution(client['id'])

        if segment is None:
            self.powerOff(id_device)

        elif segment.resolution != message['status']['type'] \
                or segment.url1 != message['status'].get('urlRight') \
                or segment.url2 != message['status'].get('urlBottom'):
            self.resolution(
                id_device,
                segment.resolution,
                segment.url1,
                segment.url2
            )
