#!/usr/bin/python3 -tt
# -*- coding: utf-8 -*-

from setuptools import setup, find_packages

from os.path import *

def read_requires(path=None):
    if path is None:
        path = join(dirname(__file__), 'requirements.txt')
        print(path)

    with open(path) as fp:
        return [l.strip() for l in fp.readlines()]

setup(
    name = 'indoktrinator',
    version = '1',
    author = 'NTK',
    description = ('Digital signage server for Telescreen'),
    license = 'MIT',
    keywords = 'video image slideshow telescreen',
    url = 'http://github.com/techlib/indoktrinator',
    include_package_data = True,
    package_data = {
        '': ['*.png', '*.js', '*.html'],
    },
    packages=find_packages(),
    classifiers = [
        'License :: OSI Approved :: MIT License',
    ],
    scripts = ['bin/indoktrinator'],
    install_requires = read_requires(),
)


# vim:set sw=4 ts=4 et:
