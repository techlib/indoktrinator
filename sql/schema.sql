SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';

CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;

COMMENT ON EXTENSION btree_gist IS 'support for indexing common datatypes in GiST';

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';

SET search_path = public, pg_catalog;

CREATE TYPE item_type AS ENUM (
    'video',
    'image',
    'website'
);


COMMENT ON TYPE item_type IS 'FIXME: Should be used by the ''item'' table.';

CREATE FUNCTION file_changed() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE row record;
DECLARE _playlist UUID;
BEGIN
    IF TG_OP = 'DELETE'
    THEN
        DELETE FROM item WHERE file = OLD.uuid;
    ELSE
        FOR row IN (SELECT uuid, duration FROM item WHERE file = NEW.uuid)
        LOOP
            -- CALL all records, because we want to touch trigger UPDATE on item
            UPDATE item SET
            duration = NEW.duration
            WHERE uuid = row.uuid;
        END LOOP;

        IF TG_OP = 'INSERT'
        THEN
            SELECT uuid INTO _playlist FROM playlist WHERE path = NEW.dir and system is TRUE;

            IF NOT FOUND
            THEN
                INSERT INTO playlist (
                    name,
                    duration,
                    path,
                    system
                )
                VALUES (
                    regexp_replace(NEW.dir, '/+', ' '),
                    NEW.duration,
                    NEW.dir,
                    TRUE
                ) RETURNING uuid into _playlist;
            END IF;

            INSERT INTO item VALUES (uuid_generate_v4(), _playlist, NEW.duration, 0, NEW.uuid);
        END IF;

    END IF;

 RETURN NEW;
END;
$$;


COMMENT ON FUNCTION file_changed() IS 'FIXME: Ineffective, wrong table. Rewrite.';

CREATE FUNCTION item_changed() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_OP = 'DELETE'
    THEN
        RETURN NEW;
    ELSE
        UPDATE playlist SET duration = (SELECT SUM(duration) FROM item WHERE playlist = NEW.playlist);
    END IF;
 RETURN NEW;
END;
$$;


COMMENT ON FUNCTION item_changed() IS 'FIXME: Merge with the other trigger.';

SET default_tablespace = '';

SET default_with_oids = false;

CREATE TABLE device (
    id character varying NOT NULL,
    name character varying NOT NULL,
    program uuid,
    photo bytea,
    online boolean DEFAULT false NOT NULL,
    power boolean DEFAULT false NOT NULL,
    CONSTRAINT device_name_valid CHECK ((length((name)::text) > 0))
);


COMMENT ON COLUMN device.id IS 'Unique identifier of the device from `/etc/machine-id`.';

COMMENT ON COLUMN device.name IS 'Human-readable machine name.';

COMMENT ON COLUMN device.program IS 'Program the device has been assigned to play.';

COMMENT ON COLUMN device.photo IS 'Image of the device for better user experience.';

COMMENT ON COLUMN device.online IS 'FIXME: Delete this column.';

COMMENT ON COLUMN device.power IS 'FIXME: Delete this column.';

CREATE TABLE event (
    uuid uuid DEFAULT uuid_generate_v4() NOT NULL,
    program uuid NOT NULL,
    playlist uuid NOT NULL,
    date date NOT NULL,
    range int4range NOT NULL,
    CONSTRAINT event_range_bounds_valid CHECK ((lower_inc(range) AND (NOT upper_inc(range)))),
    CONSTRAINT event_range_valid CHECK ((int4range(0, 86400) @> range))
);


COMMENT ON TABLE event IS 'Ad-hoc programming segment.';

COMMENT ON COLUMN event.playlist IS 'Playlist of items to schedule for this event.';

COMMENT ON COLUMN event.date IS 'A specific calendar date.';

COMMENT ON COLUMN event.range IS 'Range in seconds of that particular day when the event is to be played.';

CREATE TABLE file (
    uuid uuid DEFAULT uuid_generate_v4() NOT NULL,
    path character varying NOT NULL,
    token character varying(32) NOT NULL,
    type integer DEFAULT 0 NOT NULL,
    duration real DEFAULT 0 NOT NULL,
    name character varying,
    preview bytea,
    dir character varying NOT NULL
);


COMMENT ON TABLE file IS 'FIXME: Ditch this table and move its data to ''item''.';

COMMENT ON COLUMN file.uuid IS 'Simple identificator of file';

COMMENT ON COLUMN file.path IS 'Identificator of file';

COMMENT ON COLUMN file.token IS 'Token for unique identification of the file';

COMMENT ON COLUMN file.type IS 'file type
0 - unknown
1 - video
2 - picture';

COMMENT ON COLUMN file.duration IS 'duration in second';

COMMENT ON COLUMN file.name IS 'filename';

COMMENT ON COLUMN file.preview IS 'preview of file (if is video)';

CREATE TABLE item (
    uuid uuid DEFAULT uuid_generate_v4() NOT NULL,
    playlist uuid NOT NULL,
    duration real NOT NULL,
    "position" integer NOT NULL,
    file uuid NOT NULL,
    CONSTRAINT item_position_valid CHECK (("position" >= 0))
);


COMMENT ON TABLE item IS 'Single programming item that must be a part of a playlist.';

COMMENT ON COLUMN item.duration IS 'Number of seconds the item takes to play back.';

COMMENT ON COLUMN item."position" IS 'Position in the playlist.';

COMMENT ON COLUMN item.file IS 'FIXME: Ditch the whole ''file'' table and move relevant columns here.';

CREATE TABLE playlist (
    uuid uuid DEFAULT uuid_generate_v4() NOT NULL,
    name character varying NOT NULL,
    duration real,
    path character varying,
    system boolean DEFAULT false NOT NULL,
    CONSTRAINT playlist_name_valid CHECK ((length((name)::text) > 0))
);


COMMENT ON TABLE playlist IS 'Group of programming items.';

COMMENT ON COLUMN playlist.system IS 'True means that the playlist has been generated from the filesystem and cannot be edited by the users.';

CREATE TABLE program (
    uuid uuid DEFAULT uuid_generate_v4() NOT NULL,
    name character varying NOT NULL,
    dirty boolean DEFAULT false NOT NULL,
    CONSTRAINT program_name_valid CHECK ((length((name)::text) > 0))
);


COMMENT ON TABLE program IS 'Group of segments and events that devices can be associated with.';

CREATE TABLE segment (
    uuid uuid DEFAULT uuid_generate_v4() NOT NULL,
    program uuid NOT NULL,
    playlist uuid NOT NULL,
    day integer NOT NULL,
    range int4range NOT NULL,
    mode character varying DEFAULT 'full'::character varying NOT NULL,
    sidebar character varying,
    panel character varying,
    CONSTRAINT segment_day_valid CHECK (((day >= 0) AND (day <= 6))),
    CONSTRAINT segment_range_bounds_valid CHECK ((lower_inc(range) AND (NOT upper_inc(range)))),
    CONSTRAINT segment_range_valid CHECK ((int4range(0, 86400) @> range))
);


COMMENT ON TABLE segment IS 'Weekly schedule programming segment.';

COMMENT ON COLUMN segment.playlist IS 'Playlist of items to schedule for this segment.';

COMMENT ON COLUMN segment.day IS 'Day of the week when the segment is to be played. 0 = monday, 6 = sunday.';

COMMENT ON COLUMN segment.range IS 'Range in seconds of that particular day when the event is to be played.';

COMMENT ON COLUMN segment.mode IS 'Layout mode:

- ''full'' means no panels, just the 16:9 video
- ''sidebar'' means 4:3 video plus a sidebar with web content
- ''panel'' means 4:3 video plus both a sidebar and a bottom panel with web content';

COMMENT ON COLUMN segment.sidebar IS 'URL for the Sidebar';

COMMENT ON COLUMN segment.panel IS 'URI for the Panel';

COPY device (id, name, program, photo, online, power) FROM stdin;
\.

COPY event (uuid, program, playlist, date, range) FROM stdin;
\.

COPY file (uuid, path, token, type, duration, name, preview, dir) FROM stdin;
\.

COPY item (uuid, playlist, duration, "position", file) FROM stdin;
\.

COPY playlist (uuid, name, duration, path, system) FROM stdin;
\.

COPY program (uuid, name, dirty) FROM stdin;
\.

COPY segment (uuid, program, playlist, day, range, mode, sidebar, panel) FROM stdin;
\.

ALTER TABLE ONLY device
    ADD CONSTRAINT device_pkey PRIMARY KEY (id);

ALTER TABLE ONLY event
    ADD CONSTRAINT event_no_overlap EXCLUDE USING gist (date WITH =, range WITH &&);

ALTER TABLE ONLY event
    ADD CONSTRAINT event_pkey PRIMARY KEY (uuid);

ALTER TABLE ONLY file
    ADD CONSTRAINT file_pkey PRIMARY KEY (uuid);

ALTER TABLE ONLY file
    ADD CONSTRAINT file_unique UNIQUE (path);

ALTER TABLE ONLY item
    ADD CONSTRAINT item_pkey PRIMARY KEY (uuid);

ALTER TABLE ONLY playlist
    ADD CONSTRAINT playlist_name_unique UNIQUE (name) DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE ONLY playlist
    ADD CONSTRAINT playlist_pkey PRIMARY KEY (uuid);

ALTER TABLE ONLY program
    ADD CONSTRAINT program_name_unique UNIQUE (name) DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE ONLY program
    ADD CONSTRAINT program_pkey PRIMARY KEY (uuid);

ALTER TABLE ONLY segment
    ADD CONSTRAINT segment_no_overlap EXCLUDE USING gist (day WITH =, range WITH &&);

ALTER TABLE ONLY segment
    ADD CONSTRAINT segment_pkey PRIMARY KEY (uuid);

CREATE INDEX fki_device_program_pkey ON device USING btree (program);

CREATE INDEX fki_event_playlist_fkey ON event USING btree (playlist);

CREATE INDEX fki_event_program_fkey ON event USING btree (program);

CREATE INDEX fki_segment_playlist_fkey ON segment USING btree (playlist);

CREATE INDEX fki_segment_program_fkey ON segment USING btree (program);

CREATE TRIGGER file_trigger AFTER INSERT OR DELETE OR UPDATE ON file FOR EACH ROW EXECUTE PROCEDURE file_changed();

CREATE TRIGGER item_trigger AFTER INSERT OR DELETE OR UPDATE ON item FOR EACH ROW EXECUTE PROCEDURE item_changed();

ALTER TABLE ONLY device
    ADD CONSTRAINT device_program_pkey FOREIGN KEY (program) REFERENCES program(uuid) ON UPDATE CASCADE ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE ONLY event
    ADD CONSTRAINT event_playlist_fkey FOREIGN KEY (playlist) REFERENCES playlist(uuid) ON UPDATE CASCADE ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE ONLY event
    ADD CONSTRAINT event_program_fkey FOREIGN KEY (program) REFERENCES program(uuid) ON UPDATE CASCADE ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE ONLY item
    ADD CONSTRAINT file_fkey FOREIGN KEY (file) REFERENCES file(uuid) ON DELETE CASCADE;

ALTER TABLE ONLY item
    ADD CONSTRAINT item_playlist_fkey FOREIGN KEY (playlist) REFERENCES playlist(uuid) ON UPDATE CASCADE ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE ONLY segment
    ADD CONSTRAINT segment_playlist_fkey FOREIGN KEY (playlist) REFERENCES playlist(uuid) ON UPDATE CASCADE ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE ONLY segment
    ADD CONSTRAINT segment_program_fkey FOREIGN KEY (program) REFERENCES program(uuid) ON UPDATE CASCADE ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;

REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM indoktrinator;
GRANT ALL ON SCHEMA public TO indoktrinator;
GRANT ALL ON SCHEMA public TO PUBLIC;
