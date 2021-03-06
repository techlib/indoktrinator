#!/usr/bin/python3 -tt
# -*- coding: utf-8 -*-

from sqlalchemy.orm import class_mapper
from urllib.parse import urljoin


__all__ = ['Model']


class Table:
    NAME = None
    PKEY = 'uuid'
    RELS = []
    ORDER_BY = []

    # Do not allow primary key modifications or custom value on insert.
    # This is the default since we have mostly `uuid` primary keys.
    PROTECTED_PKEY = True

    def __init__(self, model, db):
        self.model = model
        self.db = db
        self.table = getattr(db, self.NAME)

        for key, other_table in self.RELS:
            entity = getattr(db, other_table)
            ordering = []

            for column in self.model.TABLES[other_table].ORDER_BY:
                ordering.append(getattr(entity, column))

            # NOTE: The passive_deletes and passive_updates options make
            #       SQLAlchemy leave the cascading to the database.
            self.table.relate(key, entity,
                              passive_deletes='all',
                              passive_updates=True,
                              order_by=ordering)

        # Fox the `dbdict` function.
        self.table._table.fixup = self.fixup

    def get(self, key, depth=0):
        obj = self.table.get(key)

        if obj is None:
            raise KeyError(key)

        return dbdict(obj, depth)

    def insert(self, value, depth=0):
        self.verify(value, None)

        obj = self.table.insert(**value)
        self.db.flush()

        return dbdict(obj, depth)

    def update(self, key, value, depth=0):
        obj = self.table.get(key)

        if obj is None:
            raise KeyError('object {!r} not found'.format(key))

        self.verify(value, dbdict(obj))

        for (name, field) in value.items():
            setattr(obj, name, field)

        self.db.flush()
        return dbdict(obj, depth)

    def delete(self, key):
        obj = self.table.get(key)

        if obj is None:
            raise KeyError(key)

        self.verify(None, dbdict(obj))

        self.db.delete(obj)
        self.db.flush()
        return key

    def list(self, filter_by={}, order_by=[], depth=0):
        ordering = order_by + self.ORDER_BY + [self.PKEY]
        objs = self.table.filter_by(**filter_by).order_by(*ordering).all()
        results = []

        for obj in objs:
            results.append(dbdict(obj, depth))

        return results

    def verify(self, data=None, prev=None):
        """
        Verify consistency of the inserted or updated object.
        Also useful as a form of access restriction for some fields.
        """

        if data is not None:
            if self.PROTECTED_PKEY:
                pkey = prev.get(self.PKEY) if prev is not None else None

                if data.get(self.PKEY, pkey) != pkey:
                    raise ValueError('key {!r} is protected'.format(self.PKEY))

    def fixup(self, data):
        """
        Adjust value before it is returned from ``get()`` or ``list()``.
        By default does nothing.
        """

        return data


class Device(Table):
    NAME = 'device'
    PKEY = 'id'
    RELS = [('_program', 'program')]
    ORDER_BY = ['name']

    # Devices have mutable primary keys.
    PROTECTED_PKEY = False

    def fixup(self, data):
        pc = self.db.device_photo.filter_by(id=data['id']).count()

        data['custom_photo'] = (pc > 0)
        data['photo'] = urljoin('/api/preview-image/device/', data['id'])

        return data


class Event(Table):
    NAME = 'event'
    RELS = [('_playlist', 'playlist')]
    ORDER_BY = ['program', 'date', 'range']


class File(Table):
    NAME = 'file'
    ORDER_BY = ['path']

    def fixup(self, data):
        data['preview'] = urljoin('/api/preview-image/file/', data['uuid'])
        return data

    def verify(self, data=None, prev=None):
        raise ValueError('files are immutable')


class Item(Table):
    NAME = 'item'
    RELS = [('_file', 'file')]
    ORDER_BY = ['playlist', 'position']

    def verify(self, data=None, prev=None):
        super().verify(data, prev)

        if prev is not None:
            playlist = self.db.playlist.get(prev['playlist'])

            if playlist is None:
                return

            if playlist.token is not None:
                raise ValueError('system playlist items are immutable')

            if data is not None:
                if data.get('file', prev['file']) != prev['file']:
                    raise ValueError('cannot modify item file')

        elif data is not None:
            if 'playlist' in data:
                playlist = self.db.playlist.get(data['playlist'])

                if playlist is None:
                    return

                if playlist.token is not None:
                    raise ValueError('cannot insert item to system playlist')


class Playlist(Table):
    NAME = 'playlist'
    RELS = [('items', 'item')]
    ORDER_BY = ['path', 'name']

    def fixup(self, data):
        data['system'] = data.get('token') is not None
        return data

    def verify(self, data=None, prev=None):
        super().verify(data, prev)

        if prev is not None:
            if prev['token'] is not None:
                raise ValueError('system playlists are immutable')

        if data is not None:
            for field in ('path', 'token', 'duration'):
                if field in data:
                    raise ValueError('field {!r} is immutable'.format(field))


class Program(Table):
    NAME = 'program'
    RELS = [('segments', 'segment'), ('events', 'event')]
    ORDER_BY = ['name']


class Segment(Table):
    NAME = 'segment'
    RELS = [('_playlist', 'playlist')]
    ORDER_BY = ['program', 'day', 'range']


class DevicePhoto(Table):
    NAME = 'device_photo'


class FilePreview(Table):
    NAME = 'file_preview'


class Model:
    TABLES = {
        Device.NAME: Device,
        Event.NAME: Event,
        File.NAME: File,
        Item.NAME: Item,
        Playlist.NAME: Playlist,
        Program.NAME: Program,
        Segment.NAME: Segment,
        DevicePhoto.NAME: DevicePhoto,
        FilePreview.NAME: FilePreview,
    }

    def __init__(self, db):
        self.db = db

        for name, table in self.TABLES.items():
            setattr(self, name, table(self, db))


def dbdict(obj, depth=0):
    """
    Convert an SQLAlchemy object to a dictionary.
    """

    fixup = obj._table.fixup
    mapper = class_mapper(obj.__class__)
    data = {col.key: getattr(obj, col.key) for col in mapper.columns}

    if depth == 0:
        return fixup(data)

    for (name, rel) in mapper.relationships.items():
        ref = getattr(obj, name)

        if ref is not None:
            if rel.uselist:
                data[name] = [dbdict(item, depth - 1) for item in ref]
            else:
                data[name] = dbdict(ref, depth - 1)

    return fixup(data)


# vim:set sw=4 ts=4 et:
