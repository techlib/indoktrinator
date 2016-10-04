from indoktrinator.inotifier.inotifier import Inotifier


def make_inotifier(db, manager, path, inotifier_timeout):
    inotifier = Inotifier(db, manager, path, inotifier_timeout)
    return inotifier


