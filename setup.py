#!/usr/bin/python3 -tt
# -*- coding: utf-8 -*-

from setuptools import setup, find_packages
import os.path

setup(
    name = 'indoktrinator',
    version = '1',
    author = 'NTK',
    description = ('PDNS, Kea and FreeRADIUS Configuration Tool'),
    license = 'MIT',
    keywords = 'pdns DNS DHCP Kea FreeRADIUS configuration',
    url = 'http://github.com/techlib/indoktrinator',
    install_requires = [
        'Twisted',
        'Pillow',
        'Werkzeug',
        'Flask',
        'SQLAlchemy',
        'SQLSoup',
        'psycopg2',
        'txpostgres',
        'requests',
        'txZMQ',
        'pyyaml',
        'jsonschema',
    ],
    include_package_data = True,
    package_data = {
        '': ['*.png', '*.js', '*.html'],
    },
    packages=find_packages(),
    classifiers = [
        'License :: OSI Approved :: MIT License',
    ],
    scripts = ['indoktrinator-daemon']
)


# vim:set sw=4 ts=4 et:
