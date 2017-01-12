#!/usr/bin/python3 -tt
# -*- coding: utf-8 -*-

from indoktrinator.model import Model
from natsort import natsorted, ns

__all__ = ['Playlist']


class Playlist (Model):
    TABLE = 'playlist'
    PKEY  = 'uuid'

    INCLUDE_LIST = ['items']
    INCLUDE_ITEM = ['items', 'item__file']

    def __init__(self, *args):
        super().__init__(*args)

        self.relate('items', self.e('item'))

    def get_item(self, uuid):
        q = self.manager.db.session.query(
            self.e('playlist'),
            self.e('item'),
            self.e('file')
        ).filter(
            self.e('playlist').uuid == uuid,
        ).join(
            self.e('item'),
            isouter=True,
        ).join(
            self.e('file'),
            isouter=True,
        ).order_by(
            self.e('item').position,
            self.e('file').path,
        )
        query = q.all()

        result = {}
        if len(query) > 0:
            result = {
                'uuid': query[0].MappedPlaylist.uuid,
                'name': query[0].MappedPlaylist.name,
                'duration': query[0].MappedPlaylist.duration,
                'path': query[0].MappedPlaylist.path,
                'system': query[0].MappedPlaylist.token is not None,
                'items': [],
            }

        for item in query:
            if item.MappedFile and item.MappedItem:
                result['items'].append({
                    'uuid': item.MappedItem.uuid,
                    'duration': item.MappedItem.duration,
                    'position': item.MappedItem.position,
                    'file': {
                        'uuid': item.MappedFile.uuid,
                        'duration': item.MappedFile.duration,
                        'path': item.MappedFile.path,
                        'token': item.MappedFile.token,
                        'type': item.MappedFile.type,
                        'preview': None
                    }
                })

        return result

    def list(self):
        result = []
        playlists = list(self.manager.store.playlist)
        items = self.manager.store.item.values()

        def add_file(item):
            i = item.copy()
            i['file'] = self.manager.store.file[item['file']]
            return i

        for playlist in playlists:
            p = self.manager.store.playlist[playlist].copy()
            p['items'] = [add_file(item) for item in items \
                            if item['playlist'] == p['uuid']]

            p['items'] = sorted(p['items'], key=lambda item: item['position'])

            result.append(p)

        return natsorted(result, key=lambda item: item['name'], alg=ns.IGNORECASE)

    def patch(self, data, uid):
        assert uid is not None, 'Primary key is not set'

        self.manager.item.e().filter_by(**{'playlist': uid}).delete()
        if 'items' in data:
            counter = 0
            for item in data.get('items'):
                newVal = {
                    'playlist': uid,
                    'duration': item['duration'],
                    'file': item['file'],
                    'position': counter
                }
                counter += 1

                self.manager.item.e().insert(**newVal)

        self.update(data)

# vim:set sw=4 ts=4 et:
