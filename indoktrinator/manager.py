#!/usr/bin/python3 -tt
# -*- coding: utf-8 -*-

import os
import os.path

from twisted.internet.threads import deferToThread
from twisted.internet import task, reactor
from twisted.python import log, filepath

from indoktrinator.device import Device
from indoktrinator.file import File
from indoktrinator.event import Event
from indoktrinator.item import Item
from indoktrinator.playlist import Playlist
from indoktrinator.program import Program
from indoktrinator.segment import Segment


__all__ = ['Manager']


class Manager(object):
    def __init__(self, db, checkFiles=True, **kwargs):
        self.db = db
        self.items = kwargs
        self.router = None
        self.app = None
        self.inotifier = None
        self.url = kwargs.get('url')

        # Something like models
        self.device = Device(self)
        self.file = File(self)
        self.event = Event(self)
        self.item = Item(self)
        self.playlist = Playlist(self)
        self.program = Program(self)
        self.segment = Segment(self)
        self.config = {}

        if checkFiles:
            reactor.callLater(0, self.checkFiles)

    def checkFiles(self):
        '''
        Check all files
        '''
        log.msg("Checking file structure")
        db_dict = {}
        file_dict = {}

        # get all files from DB and create a dict by path
        for file in self.file.list():
            path = os.path.join(self.config['path'], file['path'])
            normpath = os.path.normpath(path)
            db_dict[normpath.encode('utf8')] = False

        # recursive function to traverse dirrectory
        def recursion(path):
            for file in filepath.FilePath(path).listdir():
                full_path = os.path.normpath('%s/%s' % (path, file))

                if os.path.isdir(full_path):
                    recursion(full_path)

                file_dict[full_path] = full_path in db_dict

                add_file = filepath.FilePath(full_path.encode('utf8'))
                self.inotifier.addFile(add_file)

        # call recursion
        recursion(self.config['path'])

        # check all files from db if exists
        for path, value in db_dict.items():
            if path not in file_dict:
                self.inotifier.addFile(filepath.FilePath(path))

        # there is no return value


# vim:set sw=4 ts=4 et:
