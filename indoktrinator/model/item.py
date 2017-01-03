#!/usr/bin/python3 -tt
# -*- coding: utf-8 -*-

from indoktrinator.model import Model


__all__ = ['Item']


class Item (Model):
    TABLE = 'item'
    PKEY  = 'uuid'

    INCLUDE_LIST = ['_file']
    INCLUDE_ITEM = ['_file']

    def __init__(self, *args):
        super().__init__(*args)

        self.relate('_file', self.e('file'))


# vim:set sw=4 ts=4 et:
