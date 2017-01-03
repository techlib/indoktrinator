#!/usr/bin/python3 -tt
# -*- coding: utf-8 -*-

from indoktrinator.model import Model
from indoktrinator.utils import object_to_dict
from sqlalchemy import and_


__all__ = ['Program']


class Program (Model):
    TABLE = 'program'
    PKEY  = 'uuid'


# vim:set sw=4 ts=4 et:
