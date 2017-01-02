# -*- coding: utf-8 -*-
import os


def file_token(path):
    '''
    Return file token
    '''
    st = os.stat(path)
    return '{}:{}:{}'.format(st.st_dev, st.st_ino, st.st_size)
