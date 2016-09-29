import sys
import hashlib
from twisted.internet import reactor
from twisted.python import log
from twisted.internet import inotify
from twisted.python import filepath
log.startLogging(sys.stdout)

def notify(ignored, filepath, mask):
    hash_md5 = hashlib.md5()
    with open(filepath.path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk) 
    log.msg("event %s on %s in %s %s" % (', '.join(inotify.humanReadableMask(mask)), filepath.path, filepath.dirname(), hash_md5.hexdigest()))
    

notifier = inotify.INotify()
notifier.watch(filepath.FilePath("./watch"), callbacks=[notify])
notifier.startReading()
reactor.run()


