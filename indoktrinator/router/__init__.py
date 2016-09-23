import datetime
from txzmq import ZmqFactory, ZmqEndpointType, ZmqEndpoint, ZmqRouterConnection
from twisted.internet import reactor
from uuid import uuid4


class Router(ZmqRouterConnection):
    MESSAGE_COUNT = 0
    CLIENT_DICT = {}
    CALLBACK_REGISTER = {}

    def __init__(self, factory, endpoint, manager):
        super(Router, self).__init__(factory, endpoint)
        self.manager = manager

    def isExpired(self, date):
        now = datetime.datetime.now()
        (now-date).seconds > 120

    def updateClient(self, sender_id):
        if sender_id not in Router.CLIENT_DICT:
            Router.CLIENT_DICT[sender_id] = {
                'date': datetime.datetime.now(),
                'online': True,
                'change': True,
                'ping': None,
            }
        else:
            Router.CLIENT_DICT[sender_id]['change'] = Router.CLIENT_DICT[sender_id]['online'] is False
            Router.CLIENT_DICT[sender_id]['date'] = datetime.datetime.now()
            Router.CLIENT_DICT[sender_id]['online'] = True

    def checkClients(self):
        for client_id, client in Router.CLIENT_DICT.items():
            if client['change'] is False and self.isExpired(client['date']):
                client['change'] = True
                client['online'] = False

        for client_id, client in Router.CLIENT_DICT.items():
            if client['online']:
                msg = str(uuid4()).encode('utf8')
                self.ping(client_id, msg)

        online = []
        for key, val in Router.CLIENT_DICT.items():
            if val['online']:
                online.append(key)

            val['change'] = False
        print('Online', online)

        reactor.callLater(5, self.checkClients)

    def gotMessage(self, sender_id, action, message):
        Router.MESSAGE_COUNT += 1
        self.updateClient(sender_id)
        print(sender_id, action, message)

        if action in Router.CALLBACK_REGISTER:
            for method in Router.CALLBACK_REGISTER[action]:
                method(sender_id, message)

    def registerCallback(self, action, method):
        if action not in Router.CALLBACK_REGISTER:
            Router.CALLBACK_REGISTER[action] = []

        Router.CALLBACK_REGISTER[action].append(method)

    def unregisterCallback(self, action, method):
        if action in Router.CALLBACK_REGISTER \
                and method in Router.CALLBACK_REGISTER[action]:
            Router.CALLBACK_REGISTER[action].remove(method)

    def ping(self, sender_id, message):
        Router.CLIENT_DICT[sender_id]['ping'] = message

        self.sendMultipart(sender_id, [b'ping', message])

    def on_pong(self, sender_id, message):
        sender = Router.CLIENT_DICT[sender_id]
        if sender['ping'] != message:
            sender['online'] = False
            sender['change'] = True

    def on_ping(self, sender_id, message):
        self.sendMultipart(sender_id, [b'pong', message])


def make_router(db, manager, address, pool_size):
    zmq_factory = ZmqFactory()
    zmq_factory.ioThreads = pool_size
    zmq_endpoint = ZmqEndpoint(ZmqEndpointType.bind, address)
    router = Router(zmq_factory, zmq_endpoint, manager)
    router.registerCallback('pong', router.on_pong)
    router.registerCallback('ping', router.on_ping)
    router.checkClients()

    return router

# vim:set sw=4 ts=4 et:
