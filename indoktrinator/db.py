#!/usr/bin/python3 -tt
# -*- coding: utf-8 -*-

from psycopg2 import STRING
from psycopg2.extras import RangeCaster
from psycopg2.extensions import AsIs, register_type, new_type
from sqlalchemy.types import UserDefinedType
from sqlalchemy.dialects.postgresql.base import ischema_names

import binascii
import base64

__all__ = []


class Int4RangeType (UserDefinedType):
    def __init__(self):
        self.caster = RangeCaster('int4range', 'Int4Range', None, None)

    def get_col_spec(self):
        return 'INT4RANGE'

    def bind_processor(self, dialect):
        def process(value):
            if value:
                return AsIs(self.caster.range(value[0], value[1], '[)'))
        return process

    def result_processor(self, dialect, coltype):
        def process(value):
            if value is not None:
                return (value.lower, value.upper)
        return process


register_type(new_type((1082,), 'DATE', STRING))

ischema_names['int4range'] = Int4RangeType

# vim:set sw=4 ts=4 et:
