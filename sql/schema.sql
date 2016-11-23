--
-- PostgreSQL database dump
--

-- Dumped from database version 9.6.1
-- Dumped by pg_dump version 9.6.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


--
-- Name: btree_gist; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;


--
-- Name: EXTENSION btree_gist; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION btree_gist IS 'support for indexing common datatypes in GiST';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET search_path = public, pg_catalog;

--
-- Name: item_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE item_type AS ENUM (
    'video',
    'image',
    'stream',
    'website'
);


ALTER TYPE item_type OWNER TO postgres;

--
-- Name: check_program(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION check_program() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
 -- PASS all as is
 RETURN NEW;
END;
$$;


ALTER FUNCTION public.check_program() OWNER TO postgres;

--
-- Name: file_changed(); Type: FUNCTION; Schema: public; Owner: postgres
--

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
            UPDATE item SET duration = LEAST(NEW.duration, row.duration) WHERE uuid = row.uuid;
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
                    NEW.dir,
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


ALTER FUNCTION public.file_changed() OWNER TO postgres;

--
-- Name: item_changed(); Type: FUNCTION; Schema: public; Owner: postgres
--

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


ALTER FUNCTION public.item_changed() OWNER TO postgres;

--
-- Name: playlist_changed(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION playlist_changed() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE row record;
BEGIN
    IF TG_OP = 'DELETE'
    THEN
        DELETE FROM item WHERE playlist = OLD.uuid;
        RETURN OLD;
    ELSE
--         FOR row IN SELECT uuid, program, range FROM segment WHERE playlist = NEW.uuid
--         LOOP
--             if LOWER(row.range) + NEW.duration != UPPER(row.range)
--             THEN
--                 UPDATE segment SET range = int4range(LOWER(row.range), LOWER(row.range) + NEW.duration) WHERE uuid = row.uuid;
--                 UPDATE program SET dirty = TRUE WHERE uuid = row.program;
--             END IF;
--         END LOOP;
--
--         FOR row IN SELECT uuid, program, range FROM event WHERE playlist = NEW.uuid
--         LOOP
--             if LOWER(row.range) + NEW.duration != UPPER(row.range)
--             THEN
--                 UPDATE event SET range = int4range(LOWER(row.range), LOWER(row.range) + NEW.duration) WHERE uuid = row.uuid;
--                 UPDATE program SET dirty = TRUE WHERE uuid = row.program;
--             END IF;
--         END LOOP;
    END IF;
 RETURN NEW;
END;
$$;


ALTER FUNCTION public.playlist_changed() OWNER TO postgres;

--
-- Name: program_changed(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION program_changed() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
 -- PASS all as is
 RETURN NEW;
END;
$$;


ALTER FUNCTION public.program_changed() OWNER TO postgres;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: device; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE device (
    id character varying NOT NULL,
    name character varying NOT NULL,
    program uuid,
    photo bytea,
    online boolean DEFAULT false NOT NULL,
    power boolean DEFAULT false NOT NULL,
    CONSTRAINT device_name_valid CHECK ((length((name)::text) > 0))
);


ALTER TABLE device OWNER TO postgres;

--
-- Name: event; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE event (
    uuid uuid DEFAULT uuid_generate_v4() NOT NULL,
    program uuid NOT NULL,
    playlist uuid NOT NULL,
    date date NOT NULL,
    range int4range NOT NULL,
    CONSTRAINT event_range_valid CHECK ((int4range(0, 86400) @> range))
);


ALTER TABLE event OWNER TO postgres;

--
-- Name: TABLE event; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE event IS 'Ad-hoc programming segment.';


--
-- Name: COLUMN event.date; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN event.date IS 'A specific calendar date.';


--
-- Name: COLUMN event.range; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN event.range IS 'Range in seconds of that particular day when the event is to be played.';


--
-- Name: file; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE file (
    uuid uuid DEFAULT uuid_generate_v4() NOT NULL,
    path character varying NOT NULL,
    hash character varying(32) NOT NULL,
    type integer DEFAULT 0 NOT NULL,
    duration integer DEFAULT 0 NOT NULL,
    name character varying,
    preview bytea,
    dir character varying NOT NULL
);


ALTER TABLE file OWNER TO postgres;

--
-- Name: COLUMN file.uuid; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN file.uuid IS 'Simple identificator of file';


--
-- Name: COLUMN file.path; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN file.path IS 'Identificator of file';


--
-- Name: COLUMN file.hash; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN file.hash IS 'Hash of file';


--
-- Name: COLUMN file.type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN file.type IS 'file type
0 - unknown
1 - video
2 - picture';


--
-- Name: COLUMN file.duration; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN file.duration IS 'duration in second';


--
-- Name: COLUMN file.name; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN file.name IS 'filename';


--
-- Name: COLUMN file.preview; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN file.preview IS 'preview of file (if is video)';


--
-- Name: item; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE item (
    uuid uuid DEFAULT uuid_generate_v4() NOT NULL,
    playlist uuid NOT NULL,
    duration integer NOT NULL,
    "position" integer NOT NULL,
    file uuid NOT NULL,
    CONSTRAINT item_position_valid CHECK (("position" >= 0))
);


ALTER TABLE item OWNER TO postgres;

--
-- Name: TABLE item; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE item IS 'Single programming item that must be a part of a playlist.';


--
-- Name: COLUMN item.duration; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN item.duration IS 'Number of seconds the item takes to play back.';


--
-- Name: COLUMN item."position"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN item."position" IS 'Position in the playlist.';


--
-- Name: playlist; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE playlist (
    uuid uuid DEFAULT uuid_generate_v4() NOT NULL,
    name character varying NOT NULL,
    duration integer,
    path character varying,
    system boolean DEFAULT false NOT NULL,
    CONSTRAINT playlist_name_valid CHECK ((length((name)::text) > 0))
);


ALTER TABLE playlist OWNER TO postgres;

--
-- Name: TABLE playlist; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE playlist IS 'Group of programming items.';


--
-- Name: program; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE program (
    uuid uuid DEFAULT uuid_generate_v4() NOT NULL,
    name character varying NOT NULL,
    dirty boolean DEFAULT false NOT NULL,
    CONSTRAINT program_name_valid CHECK ((length((name)::text) > 0))
);


ALTER TABLE program OWNER TO postgres;

--
-- Name: TABLE program; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE program IS 'Group of segments and events that devices can be associated with.';


--
-- Name: reservation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE reservation (
    room integer,
    during tsrange
);


ALTER TABLE reservation OWNER TO postgres;

--
-- Name: segment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE segment (
    uuid uuid DEFAULT uuid_generate_v4() NOT NULL,
    program uuid NOT NULL,
    playlist uuid NOT NULL,
    day integer NOT NULL,
    range int4range NOT NULL,
    CONSTRAINT segment_day_valid CHECK (((day >= 0) AND (day <= 6))),
    CONSTRAINT segment_range_valid CHECK ((int4range(0, 86400) @> range))
);


ALTER TABLE segment OWNER TO postgres;

--
-- Name: TABLE segment; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE segment IS 'Weekly schedule programming segment.';


--
-- Name: COLUMN segment.day; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN segment.day IS 'Day of the week when the segment is to be played. 0 = monday, 6 = sunday.';


--
-- Name: COLUMN segment.range; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN segment.range IS 'Range in seconds of that particular day when the event is to be played.';


--
-- Data for Name: device; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY device (id, name, program, photo, online, power) FROM stdin;
\.


--
-- Data for Name: event; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY event (uuid, program, playlist, date, range) FROM stdin;
\.


--
-- Data for Name: file; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY file (uuid, path, hash, type, duration, name, preview, dir) FROM stdin;
\.


--
-- Data for Name: item; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY item (uuid, playlist, duration, "position", file) FROM stdin;
\.


--
-- Data for Name: playlist; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY playlist (uuid, name, duration, path, system) FROM stdin;
\.


--
-- Data for Name: program; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY program (uuid, name, dirty) FROM stdin;
\.


--
-- Data for Name: reservation; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY reservation (room, during) FROM stdin;
\.


--
-- Data for Name: segment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY segment (uuid, program, playlist, day, range) FROM stdin;
\.


--
-- Name: device device_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY device
    ADD CONSTRAINT device_pkey PRIMARY KEY (id);


--
-- Name: event event_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY event
    ADD CONSTRAINT event_pkey PRIMARY KEY (uuid);


--
-- Name: file file_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY file
    ADD CONSTRAINT file_pkey PRIMARY KEY (uuid);


--
-- Name: file file_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY file
    ADD CONSTRAINT file_unique UNIQUE (path);


--
-- Name: item item_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY item
    ADD CONSTRAINT item_pkey PRIMARY KEY (uuid);


--
-- Name: playlist playlist_name_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY playlist
    ADD CONSTRAINT playlist_name_unique UNIQUE (name) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: playlist playlist_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY playlist
    ADD CONSTRAINT playlist_pkey PRIMARY KEY (uuid);


--
-- Name: program program_name_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY program
    ADD CONSTRAINT program_name_unique UNIQUE (name) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: program program_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY program
    ADD CONSTRAINT program_pkey PRIMARY KEY (uuid);


--
-- Name: segment segment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY segment
    ADD CONSTRAINT segment_pkey PRIMARY KEY (uuid);


--
-- Name: fki_device_program_pkey; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX fki_device_program_pkey ON device USING btree (program);


--
-- Name: fki_event_playlist_fkey; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX fki_event_playlist_fkey ON event USING btree (playlist);


--
-- Name: fki_event_program_fkey; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX fki_event_program_fkey ON event USING btree (program);


--
-- Name: fki_segment_playlist_fkey; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX fki_segment_playlist_fkey ON segment USING btree (playlist);


--
-- Name: fki_segment_program_fkey; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX fki_segment_program_fkey ON segment USING btree (program);


--
-- Name: file file_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER file_trigger AFTER INSERT OR DELETE OR UPDATE ON file FOR EACH ROW EXECUTE PROCEDURE file_changed();


--
-- Name: item item_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER item_trigger AFTER INSERT OR DELETE OR UPDATE ON item FOR EACH ROW EXECUTE PROCEDURE item_changed();


--
-- Name: playlist playlist_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER playlist_trigger BEFORE INSERT OR DELETE OR UPDATE ON playlist FOR EACH ROW EXECUTE PROCEDURE playlist_changed();


--
-- Name: device device_program_pkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY device
    ADD CONSTRAINT device_program_pkey FOREIGN KEY (program) REFERENCES program(uuid) ON UPDATE CASCADE ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;


--
-- Name: event event_playlist_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY event
    ADD CONSTRAINT event_playlist_fkey FOREIGN KEY (playlist) REFERENCES playlist(uuid) ON UPDATE CASCADE ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;


--
-- Name: event event_program_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY event
    ADD CONSTRAINT event_program_fkey FOREIGN KEY (program) REFERENCES program(uuid) ON UPDATE CASCADE ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;


--
-- Name: item file_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY item
    ADD CONSTRAINT file_fkey FOREIGN KEY (file) REFERENCES file(uuid);


--
-- Name: item item_playlist_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY item
    ADD CONSTRAINT item_playlist_fkey FOREIGN KEY (playlist) REFERENCES playlist(uuid) ON UPDATE CASCADE ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;


--
-- Name: segment segment_playlist_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY segment
    ADD CONSTRAINT segment_playlist_fkey FOREIGN KEY (playlist) REFERENCES playlist(uuid) ON UPDATE CASCADE ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;


--
-- Name: segment segment_program_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY segment
    ADD CONSTRAINT segment_program_fkey FOREIGN KEY (program) REFERENCES program(uuid) ON UPDATE CASCADE ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;


--
-- PostgreSQL database dump complete
--

