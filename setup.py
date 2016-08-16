#!/usr/bin/python3 -tt
# -*- coding: utf-8 -*-

from setuptools import setup
import os.path

setup(
    name = 'indoktrinator',
    version = '1',
    author = 'NTK',
    description = ('PDNS, Kea and FreeRADIUS Configuration Tool'),
    license = 'MIT',
    keywords = 'pdns DNS DHCP Kea FreeRADIUS configuration',
    url = 'http://github.com/techlib/indoktrinator',
    include_package_data = True,
    package_data = {
        '': ['*.png', '*.js', '*.html'],
    },
    packages = [
        'indoktrinator',
    ],
    classifiers = [
        'License :: OSI Approved :: MIT License',
    ],
    scripts = ['indoktrinator-daemon']
)


# vim:set sw=4 ts=4 et:
