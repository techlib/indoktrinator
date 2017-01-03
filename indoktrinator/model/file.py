#!/usr/bin/python3 -tt
# -*- coding: utf-8 -*-

from indoktrinator.model import Model


__all__ = ['File']


class File (Model):
    TABLE = 'file'
    PKEY  = 'uuid'


# vim:set sw=4 ts=4 et:
