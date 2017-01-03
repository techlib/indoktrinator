#!/usr/bin/python3 -tt
# -*- coding: utf-8 -*-

from indoktrinator.model import Model


__all__ = ['User']


class User (Model):
    TABLE = 'user'
    PKEY  = 'cn'


# vim:set sw=4 ts=4 et:
