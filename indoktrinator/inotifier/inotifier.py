import datetime

from twisted.python import filepath
from twisted.python import log
from twisted.internet import inotify
from twisted.internet import reactor

from indoktrinator.inotifier.ffmpeg import FFMpeg


class Inotifier(object):
    def __init__(self, db, manager, path, timeout):
        self.db = db
        self.manager = manager
        self._timeout = timeout
        self.timeout = datetime.timedelta(seconds=timeout)
        self._path = filepath.FilePath(path)
        self._notifier = inotify.INotify()
        self._notifier.watch(self._path, callbacks=[self.notify])
        self._notifier.startReading()
        self._to_check = {}

        self.check()

    def notify(self, ignored, filepath, mask):
        self._to_check[filepath.path] = datetime.datetime.now()

    def check(self):
        to_check = {}

        while self._to_check:
            now = datetime.datetime.now()
            path, item = self._to_check.popitem()

            if (now - self.timeout) > item:
                self.process(path)
            else:
                to_check[path] = item

        self._to_check = to_check
        reactor.callLater(self._timeout, self.check)

    def process(self, path):

        ffmpeg = FFMpeg(path)

        #self.manager.event.insert(flask.request.get_json(force=True))



