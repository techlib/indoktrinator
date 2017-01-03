#!/usr/bin/python3 -tt
# -*- coding: utf-8 -*-

from indoktrinator.model import Model


__all__ = ['Segment']


class Segment (Model):
    TABLE = 'segment'
    PKEY  = 'uuid'

    INCLUDE_LIST = ['_program', '_playlist']
    INCLUDE_ITEM = ['_program', '_playlist']

    def __init__(self, *args):
        super().__init__(*args)

        self.relate('_program', self.e('program'))
        self.relate('_playlist', self.e('playlist'))


# vim:set sw=4 ts=4 et:
