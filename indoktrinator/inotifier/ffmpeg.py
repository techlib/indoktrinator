import sys
import os
import io
import re
import hashlib
from PIL import Image
from subprocess import Popen, PIPE

DURATION_PATTERN = re.compile(r'\((\d+)s\)|[(\d+)s]')


class FFMpeg(object):
    '''
    '''

    VIDEO_FORMAT = [
        'avi',
        'mpeg',
        'matroska',
        'matroska,webm',
        'webm',
        'mov,mp4,m4a,3gp,3g2,mj2',
    ]
    IMAGE_FORMAT = [
        'image2',
    ]
    IMAGE_DURATION = 10
    PREVIEW_SCALE = (320, 240)

    def __init__(
        self, path,
        ffmpeg='/usr/bin/ffmpeg',
        ffprobe='/usr/bin/ffprobe',
        image_duration=IMAGE_DURATION,
        preview_scale=PREVIEW_SCALE,

    ):
        if not os.path.exists(path):
            raise IOError('File does not exists')

        self.ffprobe = ffprobe
        self.ffmpeg = ffmpeg
        self.image_duration = image_duration
        self.preview_scale = preview_scale

        self._path = path
        self._hash = None
        self._format = None
        self._duration = None
        self._preview = None

    @property
    def hash(self):
        if self._hash is not None:
            return self._hash

        try:
            md5 = hashlib.md5()
            with open(self._path, 'rb') as f:
                chunk = f.read(4096)
                while len(chunk) > 0:
                    md5.update(chunk)
                    chunk = f.read(4096)

            self._hash = md5.hexdigest()
        except Exception as e:
            msg.log("hash", e)
            self._hash = None

        return self._hash

    @property
    def duration(self):
        '''
        get file duration
        '''
        if self._duration is not None:
            return self._duration

        if self.format in self.VIDEO_FORMAT:
            try:
                args = [
                    self.ffprobe,
                    '-show_entries', 'format=duration',
                    '-of', 'default=noprint_wrappers=1:nokey=1',
                    self._path
                ]
                proc = Popen(args, stdout=PIPE, stderr=PIPE)
                out, err = proc.communicate()

                self._duration = float(out)
            except Exception as e:
                self._duration = None

        elif self.format in self.IMAGE_FORMAT:
            self._duration = self.image_duration

            find = DURATION_PATTERN.find
            if find:
                self._duration = min(
                    find.group(1) or self.image_duration,
                    find.group(2) or self.image_duration
                )

        return self._duration

    @property
    def format(self):
        '''
        Get file format
        '''
        if self._format is not None:
            return self._format

        try:
            args = [
                self.ffprobe,
                '-show_entries', 'format=format_name',
                '-of', 'default=noprint_wrappers=1:nokey=1',
                self._path
            ]
            proc = Popen(args, stdout=PIPE, stderr=PIPE)
            out, err = proc.communicate()

            self._format = out.strip().lower().decode('utf8')
        except Exception as e:
            log.msg("format", e)
            self._format = e

        return self._format

    @property
    def preview(self):
        '''
        Get preview image
        '''
        if self._preview is not None:
            return self._preview

        if self.format in self.VIDEO_FORMAT:

            try:
                step = self.duration / 25
                pos = step
                # find ideal thumbnail
                while pos < self.duration:
                    args = [
                        self.ffmpeg,
                        '-ss', str(pos),
                        '-i', self._path,
                        '-vframes', '1',
                        '-q:v', '2',
                        '-f', 'mjpeg',
                        '-'
                    ]

                    proc = Popen(args, stdout=PIPE, stderr=PIPE)
                    out, err = proc.communicate()
                    self._preview = Image.open(io.BytesIO(out))

                    extrema = self._preview.convert("L").getextrema()
                    if extrema == (0, 0) or extrema == (1, 1) \
                            or extrema[0] == extrema[1]:
                        pos += step
                    else:
                        break
            except Exception as e:
                log.msg("preview", e)
                self._preview = None

        elif self.format in self.IMAGE_FORMAT:
            self._preview = Image.open(self._path)

        # scale
        if self._preview is not None:
            self._preview.thumbnail(
                self.preview_scale,
                Image.ANTIALIAS
            )

            out = io.BytesIO()
            self._preview.save(out, format='PNG')
            self._preview = out.getvalue()

        return self._preview

    @property
    def type(self):
        if self.isVideo():
            return 1
        if self.isImage():
            return 2
        return 0

    def isMultimedia(self):
        return self.format in self.VIDEO_FORMAT \
            or self.format in self.IMAGE_FORMAT

    def isVideo(self):
        return self.format in self.VIDEO_FORMAT

    def isImage(self):
        return self.format in self.IMAGE_FORMAT
