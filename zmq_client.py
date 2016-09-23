from twisted.internet import reactor
from txzmq import ZmqFactory, ZmqEndpointType, ZmqEndpoint, ZmqDealerConnection
from uuid import uuid4


class ZmqTestDealerConnection(ZmqDealerConnection):
    message_count = 0

    def gotMessage(self, action, message):
        print(action, message)
        self.sendMultipart([b'pong', message])


zf = ZmqFactory()
ep = ZmqEndpoint(ZmqEndpointType.connect, "ipc:///tmp/zmq_server.sock")
identity = bytes(str(uuid4()).encode('utf8'))

dealer = ZmqTestDealerConnection(
    zf,
    ep,
    identity=identity
)

reactor.callLater(1, dealer.sendMultipart, [b'ping', identity])
reactor.callLater(1, dealer.sendMultipart, [b'pong', identity])
reactor.run()
