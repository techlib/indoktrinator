import datetime

from twisted.python import filepath
from twisted.python import log
from twisted.internet import inotify
from twisted.internet import reactor

from indoktrinator.inotifier.ffmpeg import FFMpeg


class Inotifier(object):
    INDEX = (
                b'/index.m3u8',
                b'/index.m3u',
                b'/index.txt',
    )

    def __init__(self, db, manager, path, timeout):
        self.db = db
        self.manager = manager
        self._timeout = timeout
        self.timeout = datetime.timedelta(seconds=timeout)
        self._path = path
        self.path = filepath.FilePath(path)
        self._notifier = inotify.INotify()
        self._notifier.watch(
            self.path,
            autoAdd=True,
            callbacks=[self.notify],
            recursive=True,
        )
        self._notifier.startReading()
        self._to_check = {}

        self.check()

    def notify(self, ignored, filepath, mask):
        self._to_check[filepath] = datetime.datetime.now()

    def check(self):
        to_check = {}

        while self._to_check:
            now = datetime.datetime.now()
            filepath, item = self._to_check.popitem()

            if (now - self.timeout) > item:
                self.process(filepath)
            else:
                to_check[filepath] = item

        self._to_check = to_check
        reactor.callLater(self._timeout, self.check)

    def transformPath(self, path):
        return path[len(self._path):].decode('utf8')

    def process(self, filepath):
        '''
        Process changed file
        '''
        path = filepath.path
        transform_path = self.transformPath(path)
        transform_dir = self.transformPath(filepath.dirname())
        name = filepath.basename()

        query = self.manager.file.e().filter_by(
            path=transform_path
        )

        if filepath.exists():
            ffmpeg = FFMpeg(path)
            print(ffmpeg.format)

            if ffmpeg.isMultimedia():
                if query.count():
                    item = query.one()

                    self.manager.file.update(dict(
                        uuid=item.uuid,
                        hash=ffmpeg.hash,
                        type=ffmpeg.type,
                        duration=ffmpeg.duration,
                        name=name,
                        preview=ffmpeg.preview,
                    ))

                else:
                    self.manager.file.insert(dict(
                        path=transform_path,
                        dir=transform_dir,
                        hash=ffmpeg.hash,
                        type=ffmpeg.type,
                        duration=ffmpeg.duration,
                        name=name,
                        preview=ffmpeg.preview,
                    ))

            elif path.endswith(Inotifier.INDEX):
                pass
        else:
            query.delete()
            self.manager.db.commit()

        # application version
        #self.refreshPlayList(transform_dir)

    def refreshPlayList(self, path):
        '''
        TODO: move to DB trigger
        '''
        pass
