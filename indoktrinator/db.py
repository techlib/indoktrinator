#!/usr/bin/python3 -tt
# -*- coding: utf-8 -*-

__all__ = []

from psycopg2.extras import DateTimeRange, Range, RangeCaster
from psycopg2.extensions import AsIs
from sqlalchemy.types import UserDefinedType
from sqlalchemy.dialects.postgresql.base import ischema_names
import binascii
import base64


class TSRangeType(UserDefinedType):
    def get_col_spec(self):
        return 'TSRANGE'

    def bind_processor(self, dialect):
        def process(value):
            if value:
                return DateTimeRange(value[0], value[1])
        return process

    def result_processor(self, dialect, coltype):
        def process(value):
            if value:
                return (value.lower.isoformat(), value.upper.isoformat())
            else:
                return None
        return process


class RangeType(UserDefinedType):
    def get_col_spec(self):
        return 'RANGE'

    def bind_processor(self, dialect):
        def process(value):
            if value:
                return Range(value[0], value[1])
        return process

    def result_processor(self, dialect, coltype):
        def process(value):
            return (value.lower(), value.upper())
        return process


class InetRangeType(UserDefinedType):
    def __init__(self):
        self.caster = RangeCaster('inetrange', 'InetRange', None, None)

    def get_col_spec(self):
        return 'INETRANGE'

    def bind_processor(self, dialect):
        def process(value):
            if value:
                return AsIs(self.caster.range(value[0], value[1], '[]'))
        return process

    def result_processor(self, dialect, coltype):
        def process(value):
            v = self.caster.parse(value)
            return (v.lower, v.upper)
        return process


class Int4RangeType(UserDefinedType):
    def get_col_spec(self):
        return 'INT4RANGE'

    def __init__(self):
        self.caster = RangeCaster('int4range', 'Int4Range', None, None)

    def get_col_spec(self):
        return 'INT4RANGE'

    def bind_processor(self, dialect):
        def process(value):
            if value:
                return AsIs(self.caster.range(value[0], value[1], '[]'))
        return process

    def result_processor(self, dialect, coltype):
        def process(value):
            if value is not None:
                return (value.lower, value.upper-1)
        return process


class ByteaType(UserDefinedType):
    def get_col_spec(self):
        return 'BYTEA'

    def bind_processor(self, dialect):
        def process(value):
            if value:
                return value
        return process

    def result_processor(self, dialect, coltype):
        def process(value):
            if value:
                return (b'data:image/octet-stream;base64, ' + base64.b64encode(value))\
                    .decode('ascii')

        return process


ischema_names['tsrange']   = TSRangeType
ischema_names['range']     = RangeType
ischema_names['inetrange'] = InetRangeType
ischema_names['int4range'] = Int4RangeType
ischema_names['bytea'] = ByteaType

# vim:set sw=4 ts=4 et:
