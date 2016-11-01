# -*- coding: utf-8 -*-

import datetime
from twisted.internet import reactor
from txzmq import ZmqRouterConnection

from json import loads, dumps
from jsonschema import validate

from indoktrinator.router.schema import schema
from uuid import uuid4


class Router(ZmqRouterConnection):
    MESSAGE_COUNT = 0
    CLIENT_DICT = {}
    CALLBACK_REGISTER = {}

    def __init__(self, db, manager, factory, endpoint):
        self.db = db
        self.manager = manager
        for device in self.manager.device.list():
            Router.CLIENT_DICT[device['id']] = {
                'date': datetime.datetime.now(),
                'online': False,
                'change': False,
                'ping': None,
                'messages': {},
            }

        super(Router, self).__init__(factory, endpoint, identity=b'leader')

    def isExpired(self, date):
        now = datetime.datetime.now()
        (now-date).seconds > 120

    def getClient(self, id_device):
        if id_device not in Router.CLIENT_DICT:
            Router.CLIENT_DICT[id_device] = {
                'date': datetime.datetime.now(),
                'online': True,
                'change': True,
                'ping': None,
                'messages': {},
            }

        return Router.CLIENT_DICT[id_device]

    def updateClient(self, id_device):
        '''
        If client send some message, update current information
        '''
        client = self.getClient(id_device)
        client['change'] = Router.CLIENT_DICT[id_device]['online'] is False
        client['date'] = datetime.datetime.now()
        client['online'] = True

    def checkClients(self):
        for client_id, client in Router.CLIENT_DICT.items():
            if client['change'] is False and self.isExpired(client['date']):
                client['change'] = True
                client['online'] = False

        for client_id, client in Router.CLIENT_DICT.items():
            if client['online']:
                self.ping(client_id)

        online = []
        for key, val in Router.CLIENT_DICT.items():
            if val['online']:
                online.append(key)

            val['change'] = False

        reactor.callLater(5, self.checkClients)

    def gotMessage(self, id_device, raw, timestamp):
        print(id_device, raw, timestamp)
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
            print(e)

    def sendMsg(self, id_device, type, message, id=None):
        if isinstance(id_device, str):
            id_device = id_device.encode('utf8')

        message['type'] = type
        message['id'] = id or str(uuid4())
        raw = dumps(message).encode('utf8')
        timestamp = datetime.datetime.now().isoformat().encode('utf8')

        data = [raw, timestamp]

        self.sendMultipart(
            id_device,
            data
        )
        return message['id']

    def registerCallback(self, action, method):
        if action not in Router.CALLBACK_REGISTER:
            Router.CALLBACK_REGISTER[action] = []

        Router.CALLBACK_REGISTER[action].append(method)

    def unregisterCallback(self, action, method):
        if action in Router.CALLBACK_REGISTER \
                and method in Router.CALLBACK_REGISTER[action]:
            Router.CALLBACK_REGISTER[action].remove(method)

    def ping(self, id_device, id=None):
        '''
        Send ping to the device
        '''
        client = self.getClient(id_device)
        client['ping'] = self.sendMsg(id_device, 'ping', {})

    def pong(self, id_device, id):
        self.sendMsg(id_device, 'pong', {}, id)

    def plan(self, device_id):
        '''
        Send plan to the device
        '''
        pass

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
        self.sendMsg(id_device, 'resolution', {'resolution': {'type': type, 'urlRight': url1, 'urlBottom': url2}})

    def url(self, id_device, url1=None, url2=None):
        message = {}
        if url1:
            message['urlRight'] = url1

        if url2:
            message['urlBottom'] = url2

        self.sendMsg(id_device, 'url', message)

    def ok(self, id_device, message):
        self.sendMsg(id_device, 'ok', {}, id=message['id'])

    def error(self, id_device, message, code=None, reply=None):
        self.sendMsg(
            id_device,
            'error',
            {
                'code': code,
                'message': reply,
            },
            id=message['id']
        )

    def on_ping(self, id_device, message):
        self.pong(id_device, message['id'])

    def on_pong(self, id_device, message):
        client = self.getClient(id_device)
        if client['ping'] != message['id']:
            print("TODO: pong is wrong")

    def on_init(self, id_device, message):
        self.ok(id_device, message)

        # self.plan(id_device)
        self.resolution(id_device, 'both', url1='https://www.seznam.cz', url2='https://www.google.com')

    def on_ok(self, id_device, message):
        '''
        Mark as read
        '''
        pass

    def on_error(self, id_device, message):
        '''
        Log error
        '''
        pass
