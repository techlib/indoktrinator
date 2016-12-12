from indoktrinator.inotifier.inotifier import Inotifier


def make_inotifier(db, manager, path, inotifier_timeout, **kwargs):
    inotifier = Inotifier(db, manager, path, inotifier_timeout, **kwargs)
    return inotifier


