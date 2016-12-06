# -*- coding: utf-8 -*-

from txzmq import ZmqFactory, ZmqEndpointType, ZmqEndpoint
from twisted.python import log
from indoktrinator.router.router import Router


def make_router(db, manager, address, pool_size):
    zmq_factory = ZmqFactory()
    zmq_factory.ioThreads = pool_size
    zmq_endpoint = ZmqEndpoint(ZmqEndpointType.bind, address)

    router = Router(db, manager, zmq_factory, zmq_endpoint)

    log.msg("Router: register callbacks")
    router.registerCallback('init', router.on_init)
    router.registerCallback('ping', router.on_ping)
    router.registerCallback('pong', router.on_pong)
    router.registerCallback('status', router.on_status)
    router.checkClients()

    return router

# vim:set sw=4 ts=4 et:
