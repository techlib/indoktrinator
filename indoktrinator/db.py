#!/usr/bin/python3 -tt
# -*- coding: utf-8 -*-

from functools import wraps

from psycopg2 import STRING
from psycopg2.extras import RangeCaster
from psycopg2.extensions import AsIs, register_type, new_type
from sqlalchemy.types import UserDefinedType
from sqlalchemy.dialects.postgresql.base import ischema_names


__all__ = ["with_session", "with_db_session"]


def _sess(s):
    # scoped_session je volatelná → vrať aktuální Session
    return s() if callable(s) and hasattr(s, "remove") else s

def with_db_session(db):
    def decorate(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            sess = _sess(db.session)
            if sess.get_transaction() is None:
                with sess.begin():
                    return fn(*args, **kwargs)
            # už běží transakce → jen zavolat bez dalšího begin()
            return fn(*args, **kwargs)
        return wrapper
    return decorate

def with_session(fn):
    @wraps(fn)
    def wrapper(self, *args, **kwargs):
        sess = _sess(self.db.session)
        if sess.get_transaction() is None:
            with sess.begin():
                return fn(self, *args, **kwargs)
        return fn(self, *args, **kwargs)
    return wrapper

class Int4RangeType(UserDefinedType):
    def __init__(self):
        self.caster = RangeCaster("int4range", "Int4Range", None, None)

    def get_col_spec(self):
        return "INT4RANGE"

    def bind_processor(self, dialect):
        def process(value):
            if value is None:
                return None
            lo, hi = value  # očekáváš tuple (lo, hi)
            # POZOR: bez mezer a bez AsIs, Postgres si text přetypuje:
            return f"[{int(lo)},{int(hi)})"

        return process

    def result_processor(self, dialect, coltype):
        def process(value):
            if value is not None:
                return (value.lower, value.upper)

        return process


register_type(new_type((1082,), "DATE", STRING))

ischema_names["int4range"] = Int4RangeType

# vim:set sw=4 ts=4 et:
