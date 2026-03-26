from __future__ import annotations
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import scoped_session, sessionmaker, class_mapper
from sqlalchemy import inspect, create_engine
import re

__all__ = ["SQLAlchemyDB"]


class QueryProxy:
    def __init__(self, query, session: scoped_session):
        self._query = query
        self._session = session

    # --- readers ---
    def one_or_none(self):
        return self._query.one_or_none()

    def first(self):
        return self._query.first()

    def all(self):
        return self._query.all()

    def count(self):
        return self._query.count()

    # --- transformers ---
    def order_by(self, *cols):
        return QueryProxy(self._query.order_by(*cols), self._session)

    def limit(self, n: int):
        return QueryProxy(self._query.limit(n), self._session)

    def offset(self, n: int):
        return QueryProxy(self._query.offset(n), self._session)

    # --- mutators ---
    def update(self, values: dict):
        entity = self._query.column_descriptions[0]["entity"]
        values = _coerce_relationship_scalars_to_fk(entity, values)
        res = self._query.update(values)
        self._session.flush()
        return res

    def delete(self):
        res = self._query.delete(synchronize_session=False)
        self._session.flush()
        return res

    def __iter__(self):
        return iter(self.all())

    @property
    def sa(self):
        return self._query


class TableProxy:
    def __init__(self, name: str, mapped_class, session: scoped_session):
        self.name = name
        self._cls = mapped_class
        self._session = session

    def __getattr__(self, item):
        try:
            return getattr(self._cls, item)
        except AttributeError:
            raise AttributeError(item)

    # --- CRUD ---
    def get(self, key):
        return self._session.get(self._cls, key)

    def insert(self, **kwargs):
        kwargs = _coerce_relationship_scalars_to_fk(self._cls, kwargs)
        cols = set(self.get_columns())
        kwargs = {k: v for k, v in kwargs.items() if k in cols}
        obj = self._cls(**kwargs)
        self._session.add(obj)
        return obj

    def delete(self, obj):
        self._session.delete(obj)

    # --- queries ---
    def all(self):
        return self._session.query(self._cls).all()

    def filter(self, *criterion):
        q = self._session.query(self._cls).filter(*criterion)
        return QueryProxy(q, self._session)

    def filter_by(self, **kwargs):
        q = self._session.query(self._cls).filter_by(**kwargs)
        return QueryProxy(q, self._session)

    def count(self):
        return self._session.query(self._cls).count()

    # --- introspection ---
    def get_columns(self):
        return list(inspect(self._cls).columns.keys())

    def get_pk_columns(self):
        return [col.key for col in inspect(self._cls).primary_key]

    def __repr__(self):
        return f"<TableProxy {self.name}>"


class SQLAlchemyDB:
    """
    Minimal SQLAlchemy automap adapter for table-based access.

    Usage:
        db = SQLAlchemyDB(engine)
        db.<table>          -> TableProxy
        db.flush()          -> flush current session
        db.delete(obj)      -> mark object for deletion
        db.session          -> underlying scoped_session
    """

    def __init__(self, engine, reflect_schema=None):
        if isinstance(engine, str):
            engine = create_engine(engine)
        self.engine = engine
        self.session = scoped_session(
            sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
        )

        Base = automap_base()

        def camel_to_snake(name: str) -> str:
            s1 = re.sub(r"(.)([A-Z][a-z]+)", r"\1_\2", name)
            s2 = re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", s1)
            return s2.replace("__", "_").lower()

        def pluralize(word: str) -> str:
            if not word:
                return word
            if word.endswith("s"):
                return word
            if word.endswith("y") and len(word) > 1 and word[-2] not in "aeiou":
                return word[:-1] + "ies"
            return word + "s"

        def name_for_scalar_relationship(base, local_cls, referred_cls, constraint):
            name = camel_to_snake(referred_cls.__name__)
            t = getattr(local_cls, "__table__", None)
            cols = set(t.columns.keys()) if t is not None else set()
            return f"_{name}" if name in cols else name

        def name_for_collection_relationship(base, local_cls, referred_cls, constraint):
            return pluralize(camel_to_snake(referred_cls.__name__))

        prepare_kwargs = dict(
            autoload_with=self.engine,
            name_for_scalar_relationship=name_for_scalar_relationship,
            name_for_collection_relationship=name_for_collection_relationship,
        )
        if reflect_schema is not None:
            prepare_kwargs["only"] = reflect_schema

        Base.prepare(**prepare_kwargs)

        self._Base = Base
        self._table_proxies = {}

        for class_name, mapped in Base.classes.items():
            proxy = TableProxy(class_name, mapped, self.session)
            setattr(self, class_name, proxy)
            self._table_proxies[class_name] = proxy

        # Lowercase aliases where not already present.
        for tbl_name, proxy in list(self._table_proxies.items()):
            lower = tbl_name.lower()
            if lower not in self._table_proxies:
                setattr(self, lower, proxy)
                self._table_proxies[lower] = proxy

    def flush(self):
        self.session.flush()

    def delete(self, obj):
        self.session.delete(obj)

    def __getattr__(self, item):
        raise AttributeError(item)


def _coerce_relationship_scalars_to_fk(obj_class, payload: dict) -> dict:
    mapper = class_mapper(obj_class)
    rels = {rel.key: rel for rel in mapper.relationships}
    out = dict(payload)
    for key, value in list(payload.items()):
        rel = rels.get(key)
        if not rel or rel.uselist:
            continue
        if isinstance(value, (str, int, bytes)):
            local_cols = list(rel.local_columns)
            if len(local_cols) == 1:
                fk = local_cols[0].key
                out.pop(key, None)
                out[fk] = value
    return out

# vim:set sw=4 ts=4 et:
