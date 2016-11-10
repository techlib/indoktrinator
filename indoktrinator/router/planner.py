

import datetime


class Playlist(object):
    '''
    Create playlist
    '''
    def __init__(self, manager, uuid):
        '''
        Load playlist
        '''
        self.manager = manager
        self.reset()
        self.items = [
            (result[0], min(result[1], result[2]), result[3])
            for result in manager.db.session.query(
                manager.file.e().path,
                manager.file.e().duration,
                manager.item.e().duration,
                manager.file.e().type,
            ).filter(
                manager.file.e().uuid == manager.item.e().file,
                manager.item.e().playlist == uuid,
            ).order_by(manager.item.e().position)
        ]

    def getItems(self, start, end):
        '''
        Iterate throught items in cycle
        [(url, start, stop)]
        '''

        result = []
        while start < end:
            item = self.items[self.item]
            self.item = (self.item + 1) % len(self.items)

            pos = min(end, start+item[1])
            result.append((self.manager.url + item[0], start, pos, item[2]))
            start = pos
        return result

    def reset(self):
        '''
        reset playlist
        '''
        self.item = 0


class Planner(object):

    def __init__(self, manager, id_program, weekday=None, date=None):
        '''
        Get all segment and event from database
        '''
        self.segment_list = []
        self.event_list = []
        self.segment_playlist = {}
        self.event_playlist = {}

        if weekday is None:
            weekday = (datetime.datetime.now().isoweekday()%7)

        if date is None:
            date = datetime.datetime.now().date()

        self.segment_list = [
            (segment.range[0], segment.range[1], Playlist(manager, segment.playlist))
            for segment in manager.segment.e().filter(
                manager.segment.e().program == id_program,
                manager.segment.e().day == weekday,
            ).order_by(
                manager.segment.e().range
            )
        ]

        self.event_list = [
            (event.range[0], event.range[1], Playlist(manager, event.playlist))
            for event in manager.event.e().filter(
                manager.event.e().program == id_program,
                manager.event.e().date == date,
            ).order_by(
                manager.event.e().range
            )
        ]

    def getSegment(self):
        '''
        get segment or None
        (start, stop, playlist)
        '''
        if self.segment_list:
            result = self.segment_list[0]
            self.segment_list = self.segment_list[1:]
            return result

    def getEvent(self):
        '''
        get event or None
        (start, stop, playlist)
        '''
        if self.event_list:
            result = self.event_list[0]
            self.event_list = self.event_list[1:]
            return result

    @property
    def plan(self):
        '''
        Generate plan
        '''
        result = []
        segment = None
        event = None
        time = 0
        end = 0

        while True:
            if segment is None or segment[1] <= time:
                segment = self.getSegment()
                if segment is not None:
                    segment[2].reset()

            if event is None or event[1] <= time:
                event = self.getEvent()
                if event is not None:
                    event[2].reset()

            if segment is None and event is None:
                return result

            # add segment
            if segment is not None and (event is None or segment[0] < event[0]):
                if segment[0] > time:
                    time = segment[0]

                end = min(segment[1], event[0]) if event is not None else segment[1]
                result += segment[2].getItems(time, end)
                time = end

            elif event is not None and (segment is None or event[0] < segment[0]):
                end = event[1]
                if event[0] > time:
                    time = event[0]
                result += event[2].getItems(time, end)
                time = event[1]
