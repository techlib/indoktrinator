# Indoktrinátor

This software aims to greatly simplify management of digital information screens in libraries and similar institutions. Its development has been funded by [NTK][] and [VISK][].

[NTK]: http://techlib.cz/
[VISK]: http://visk.nkp.cz/


## Documentation

Documentation requires `asciidoctor` with some addons:

    gem install asciidoctor asciidoctor-diagram
    gem install --pre asciidoctor-pdf

Since it contains some diagrams, you also need `plantuml`:

    yum install -y plantuml

Create RPM package with

    python3 setup.py bdist_rpm


## INI file

You must set manager.url and inotifier.path.
* Manager.url is base url for media files.
* Inotifier.url pointing to directory with media files

Final media url is manager.url + file_path_from_intofier_url

example
```
[http]
; Address of HTTP server for our website.
host = 0.0.0.0 ; IP for binding
port = 7070 ; port for bindinf

; Enable Flask debugging facilities.
debug = 1

[manager]
; Size of the thread pool dedicated to background operations.
pool_size = 2
url = http://10.93.0.95:7070/media

[inotifier]
; Path to the media files
path = /tmp/indoktrinator
; Check file "tick" stabilization
timeout = 5

[router]
; ZMQ server binding
address = tcp://0.0.0.0:5555
pool_size = 2

[database]
; PostgreSQL database access credentials.
url = postgresql://postgres@/indoktrinator

[access]
; Only omnipotent users can alter devices.
admin = +omnipotent

user = +* -impotent
```
