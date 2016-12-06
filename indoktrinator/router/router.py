# -*- coding: utf-8 -*-
import sys
import traceback
import datetime
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
                'date': datetime.datetime.now(),
                'online': False,
                'change': False,
                'ping': None,
                'messages': {},
            }

        super(Router, self).__init__(factory, endpoint, identity=b'leader')

    def isExpired(self, date):
        '''
        CHeck if date is expired - meens older than 120 second
        '''
        now = datetime.datetime.now()
        (now-date).seconds > 120

    def getClient(self, id_device):
        '''
        Get client from connected clients
        '''
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
        '''
        Check client connection status and save
        '''
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
            log.msg("Exception: %s" % e)

    def sendMsg(self, id_device, type, message, id=None):
        '''
        Send message to client
        '''
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

    def ping(self, id_device, id=None):
        '''
        Send ping to the device
        '''
        client = self.getClient(id_device)
        client['ping'] = self.sendMsg(id_device, 'ping', {})

    def pong(self, id_device, id):
        '''
        Send pong message to device
        '''
        self.sendMsg(id_device, 'pong', {}, id)
        print("PONG", id_device)

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
                plan.append({
                    'start': item[1],
                    'end': item[2],
                    'type': 'video' if item[3] == 1 else 'image',
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
        self.sendMsg(id_device, 'resolution', {'resolution': {'type': type, 'urlRight': url1, 'urlBottom': url2}})

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

    def ok(self, id_device, message):
        '''
        Universal OK message to reply
        '''
        self.sendMsg(id_device, 'ok', {}, id=message['id'])

    def error(self, id_device, message, code=None, reply=None):
        '''
        Universal Error message to reply
        '''
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
        '''
        callback on ping message
        '''
        self.pong(id_device, message['id'])

    def on_pong(self, id_device, message):
        '''
        callback on pong message
        '''
        client = self.getClient(id_device)
        if client['ping'] != message['id']:
            log.error("Pong is wrong")

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

        self.ok(id_device, message)
        self.plan(id_device)
        self.resolution(
            id_device,
            'both',
            url1='https://www.seznam.cz',
            url2='https://www.google.com'
        )

    def on_status(self, id_device, message):
        id_device_str = id_device.decode('utf8')
        print(message)

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
