import datetime
import re

from twisted.python import filepath, log
from twisted.internet import inotify
from twisted.internet import reactor

from indoktrinator.inotifier.ffmpeg import FFMpeg

EXT_PATTERN = re.compile('#EXTINF:(\d+),(.*)')


class Inotifier(object):
    '''
    '''
    INDEX = (
                b'/index.m3u8',
                b'/index.m3u',
                b'/index.txt',
    )

    def __init__(
        self,
        db,
        manager,
        path,
        timeout,
        ffmpeg='/usr/bin/ffmpeg',
        ffprobe='/usr/bin/ffprobe',
    ):
        '''
        inicialize variables
        '''
        self.db = db
        self.manager = manager
        self._timeout = timeout
        self.timeout = datetime.timedelta(seconds=timeout)
        self._path = path
        self.path = filepath.FilePath(path)
        self._notifier = inotify.INotify()
        self._ffmpeg = ffmpeg
        self._ffprobe = ffprobe
        self._notifier.watch(
            self.path,
            autoAdd=True,
            callbacks=[self.notify],
            recursive=True,
        )
        self._notifier.startReading()
        self._to_check_files = {}
        self._to_check_folders = {}
        self._to_check_devices = {}

        self.check()

    def notify(self, ignored, filepath, mask):
        '''
        '''
        self.addFile(filepath)

    def addDevice(self, id_device):
        '''
        Add device to notify list
        '''
        now = datetime.datetime.now()
        if isinstance(id_device, str):
            id_device = id_device.encode('utf8')

        self._to_check_devices[id_device] = now

    def addFile(self, filepath):
        self._to_check_files[filepath] = datetime.datetime.now()

    def check(self):
        '''
        Periodic tick function, that call
        method after changes timeouts
        '''
        to_check = {}

        # watch file from intotify and proces by FFMPEG class
        while self._to_check_files:
            now = datetime.datetime.now()
            filepath, item = self._to_check_files.popitem()

            if (now - self.timeout) > item:
                self.processFile(filepath)
            else:
                to_check[filepath] = item
        self._to_check_files = to_check

        # after change in directory
        to_check = {}
        while self._to_check_folders:
            now = datetime.datetime.now()
            folderpath, item = self._to_check_folders.popitem()
            if (now - self.timeout) > item:
                self.processFolder(folderpath)
            else:
                to_check[folderpath] = item
        self._to_check_folders = to_check

        # after playlist change
        to_check = {}
        while self._to_check_devices:
            now = datetime.datetime.now()
            device, item = self._to_check_devices.popitem()

            if (now - self.timeout) > item and not self._to_check_folders \
                    and not self._to_check_files:
                print(device)
                self.manager.router.plan(device)
            else:
                to_check[device] = item
        self._to_check_devices = to_check

        reactor.callLater(self._timeout, self.check)

    def transformPath(self, path):
        '''
        '''
        result = path[len(self._path):]
        if not isinstance(result, str):
            result = result.decode('utf8')
        return result

    def processFile(self, filepath):
        '''
        Process changed file
        '''
        log.msg("Processing file: %s" % filepath.path)
        now = datetime.datetime.now()
        path = filepath.path
        transform_path = self.transformPath(path)
        transform_dir = '/' + self.transformPath(filepath.dirname())
        name = filepath.basename()
        if not isinstance(name, str):
            name = name.decode('utf8')

        query = self.manager.file.e().filter_by(
            path=transform_path
        )

        if filepath.exists():
            ffmpeg = FFMpeg(path, ffprobe=self._ffprobe, ffmpeg=self._ffmpeg)

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

                transform_dir = '/' + self.transformPath(filepath.dirname())
                self._to_check_folders[transform_dir] = now

            elif path.endswith(Inotifier.INDEX):
                self.refreshPlayList(transform_dir, path)
        else:
            query.delete()
            self.manager.db.commit()
            self._to_check_folders[transform_dir] = now

    def processFolder(self, transform_dir, playlist='/index.m3u8'):
        '''
        Save by actual database status
        '''
        devices = []
        first = True
        f_open = False
        f = None

        # Get file from DB and write to playlist
        for result in self.manager.db.session.query(
            self.manager.file.e().name,
            self.manager.item.e().duration,
        ).filter(
            self.manager.file.e().uuid == self.manager.item.e().file,
            self.manager.file.e().dir == transform_dir,
            self.manager.playlist.e().uuid == self.manager.item.e().playlist,
            self.manager.playlist.e().system == True,
        ).order_by(
            self.manager.item.e().position
        ).group_by(
            self.manager.file.e().uuid,
            self.manager.file.e().name,
            self.manager.item.e().duration,
            self.manager.item.e().position,
        ):
            if first:
                f_open = True
                first = False
                f = open(self._path + playlist, 'w')
                f.write('#EXTM3U\r\n\r\n')

            f.write('#EXTINF:%d,%s\r\n' % (result.duration, result.name))
            f.write('%s\r\n\r\n' % result.name)

        if f_open:
            f.close()

        # get all affected devices and store
        for device in self.manager.device.e().join(
            self.manager.program.e(),
            self.manager.segment.e(),
            self.manager.event.e(),
            self.manager.playlist.e(),
        ).filter(
            self.manager.playlist.e().system==True,
            self.manager.playlist.e().path==transform_dir,
        ):
            self.addDevice(device.id)

    def refreshPlayList(self, transform_dir, path):
        '''
        Hook call after change of index (playlist) file
        '''
        f = open(path, 'r')
        lines = f.readlines()

        duration = 0
        position = 0

        for _line in lines:
            line = _line.rstrip()
            if line == '':
                continue

            if line.upper() == '#EXTM3U':
                continue

            match = EXT_PATTERN.match(line)
            if match:
                duration = int(match.group(1))
                continue

            item = self.manager.item.e().filter(
                self.manager.file.e().name == line,
                self.manager.file.e().dir == transform_dir,
                self.manager.file.e().uuid == self.manager.item.e().file,
                self.manager.playlist.e().uuid == self.manager.item.e().playlist,
                self.manager.playlist.e().path == transform_dir,
                self.manager.playlist.e().system == True,
            ).one_or_none()

            if item is not None:
                position += 1
                self.manager.item.update({
                    'uuid': item.uuid,
                    'duration': duration,
                    'position': position,
                })

        f.close()

