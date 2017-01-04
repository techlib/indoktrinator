#!/usr/bin/python3 -tt
# -*- coding: utf-8 -*-

from indoktrinator.model import Model
from sqlalchemy import and_, text
from datetime import datetime


__all__ = ['Device']


class Device (Model):
    TABLE = 'device'
    PKEY  = 'id'

    INCLUDE_LIST = ['_program']
    INCLUDE_ITEM = ['_program']

    def __init__(self, *args):
        super().__init__(*args)

        self.relate('_program', self.e('program'))


# vim:set sw=4 ts=4 et:
