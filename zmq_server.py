#!/usr/bin/python3 -tt
# -*- coding: utf-8 -*-
from twisted.internet import reactor
from txzmq import  ZmqRouterConnection


class ZmqTestRouterConnection(ZmqRouterConnection):
    message_count = 0

    def gotMessage(self, senderId, message):
        print("Received message: %s from %s" %( message, senderId))
        reactor.callLater(1, self.sendMsg, senderId, message)
        reactor.callLater(2, self.sendMsg, senderId, message)

zf = ZmqFactory()
ep = ZmqEndpoint(ZmqEndpointType.bind, "ipc:///tmp/zmq_server.sock")
router = ZmqTestRouterConnection(
    zf,
    ep,
)

reactor.run()
