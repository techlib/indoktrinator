#!/usr/bin/python3 -tt
# -*- coding: utf-8 -*-
import sys, traceback
from indoktrinator.model import Model
from indoktrinator.utils import object_to_dict
from sqlalchemy import and_

__all__ = ['Playlist']


class Playlist(Model):
    def init(self):
        self.table_name = 'playlist'
        # Primary key
        self.pkey = 'uuid'
        # Relations
        self.relate('items', self.e('item'))
        self.include_relations = {'item': ['items', 'item__file'], 'list': ['items']}

    def get_item(self, uuid):
        q = self.manager.db.session.query(
            self.e('playlist'),
            self.e('item'),
            self.e('file')
        ).filter(
            self.e('playlist').uuid==uuid,
        ).join(
            self.e('item'),
            isouter=True,
        ).join(
            self.e('file'),
            isouter=True,
        ).order_by(
            self.e('item').position
        )
        print(q)
        query = q.all()

        result = {}
        if len(query) > 0:
            result = {
                'uuid': query[0].MappedPlaylist.uuid,
                'name': query[0].MappedPlaylist.name,
                'duration': query[0].MappedPlaylist.duration,
                'path': query[0].MappedPlaylist.path,
                'system': query[0].MappedPlaylist.system,
                'items': [],
            }

        for item in query:
            if item.MappedFile and item.MappedItem:
                result['items'].append({
                    'uuid': item.MappedItem.uuid,
                    'duration': item.MappedItem.duration,
                    'position': item.MappedItem.position,
                    'file': item.MappedFile.uuid,
                    'file_uuid': item.MappedFile.uuid,
                    'file_duration': item.MappedFile.duration,
                    'file_path': item.MappedFile.path,
                    'file_hash': item.MappedFile.hash,
                    'file_type': item.MappedFile.type,
                    'file_name': item.MappedFile.name,
                    'file_preview': item.MappedFile.preview,
                    'file_dir': item.MappedFile.dir,
                })

        return result

    def changed(self, key):
        for item in self.manager.device.uuidByPlaylist(key):
            device = item.id.encode('utf8')
            self.manager.inotifier.addDevice(device)

# vim:set sw=4 ts=4 et:
