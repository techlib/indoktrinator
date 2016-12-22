#!/usr/bin/python3 -tt
# -*- coding: utf-8 -*-

from txzmq import ZmqFactory, ZmqEndpointType, ZmqEndpoint
from twisted.python import log
from indoktrinator.router.router import Router


def make_router(manager, address, pool_size):
    zmq_factory = ZmqFactory()
    zmq_factory.ioThreads = pool_size
    zmq_endpoint = ZmqEndpoint(ZmqEndpointType.bind, address)

    router = Router(manager, zmq_factory, zmq_endpoint)
    router.start()

    return router

# vim:set sw=4 ts=4 et:
