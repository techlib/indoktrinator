# Indoktrinátor: Digital Signage

This is the management component of an information screen control solution for libraries and similar institutions. It utilizes the local file system as a source of the files to play back and maintains a database with programming information.

<img alt="Screenshot: Devices" src="doc/screenshots/devices.png" align="left" width="30%"/>
<img alt="Screenshot: Playlists" src="doc/screenshots/playlists.png" align="left" width="30%"/>
<img alt="Screenshot: Programs" src="doc/screenshots/programs.png" align="left" width="30%"/>

Apart from simple management of connected devices running the [Telescreen][] application, it allows all properly authorized users to create and modify programs.

Programs comprise of segments -- playlists scheduled for certain hours in an idealized week. Most playlists are automatically detected from the file system, but synthetic ones can be created freely.

The solution does not support multicast streaming or web-based content uploading. We expect that the files are made accessible using a Samba or NFS share. Content is transmitted using HTTP and use of a reverse proxy is highly recommended.

Absence of streaming limits the amount of devices that can be deployed, but enables extremely fast content deployment with the ability to play back virtually anything without transcoding-induced quality degradation.


## Installation

Since Indoktrinátor runs on [Python 3][], the dependencies are currently somewhat unstable. Most notably, [Twisted][] WSGI support was only recently ported and thus a very fresh release (newer than 15.5.0) is required.

If such a release is available, all dependencies can be fetched automatically with:

    pip3 install -r requirements.txt

In case you need to install newer Twisted:

    pip3 install -e 'git+https://github.com/twisted/twisted.git@trunk#egg=twisted'

You might want to consider creating a sandbox (so-called [virtualenv][]) to hold these dependencies so that you do not clobber your system packages.

Next, you need to download the client code dependencies. This has been automated, but still requires `make` and `npm`:

    make


## Database

You need to initialize your database with the `sql/schema.sql` script. After creating the login role and the database as usual:

    CREATE ROLE indoktrinator ENCRYPTED PASSWORD 'indoktrinator' LOGIN;
    CREATE DATABASE indoktrinator OWNER indoktrinator;
    \c indoktrinator
    ALTER SCHEMA public OWNER TO indoktrinator;

You should just read the file in:

    psql -U indoktrinator indoktrinator <sql/schema.sql

And that's it.


## Running

Create a configuration file based on the included `config/indoktrinator.ini` and start the application with:

    bin/indoktrinator -c config/indoktrinator.ini

If you feel like it, create an [unit file][] to start the application automatically.


## Authentication

The application does not perform any kind of authentication. You need to ensure that it receives a single HTTP header called `X-Roles` that includes roles of the current user. These roles are mapped to privileges using the rules in the `acl` section of the configuration file. Individual roles are extracted from the `X-Roles` header using the `\w+` regular expression. Valid formats include `omnipotent dictator` or `sysadmin;director`.

There is only one privilege level:

- `user` can access the application and manipulate with everything.

There are several ways to get this header set, but you probably want to use [httpd][] and either manipulate the headers directly or use the [Shibboleth SSO][].


## Documentation

Documentation requires `asciidoctor` with some add-ons:

    gem install asciidoctor asciidoctor-diagram
    gem install --pre asciidoctor-pdf

Since it contains some diagrams, you also need `plantuml`:

    yum install -y plantuml

You most probably do not care, since its just the original project specification written in Czech. Sorry for that.


[PostgreSQL]: http://www.postgresql.org/
[Python 3]: https://en.wikipedia.org/wiki/History_of_Python#Version_3.0
[Twisted]: https://twistedmatrix.com/trac/
[virtualenv]: http://docs.python-guide.org/en/latest/dev/virtualenvs/
[unit file]: https://access.redhat.com/documentation/en-US/Red_Hat_Enterprise_Linux/7/html/System_Administrators_Guide/sect-Managing_Services_with_systemd-Unit_Files.html
[httpd]: https://httpd.apache.org/docs/2.4/
[Shibboleth SSO]: https://shibboleth.net/
[Telescreen]: http://github.com/techlib/telescreen/
