--
-- PostgreSQL database dump
--

SET statement_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;

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
-- Name: item_type; Type: TYPE; Schema: public; Owner: tv
--

CREATE TYPE item_type AS ENUM (
    'video',
    'image',
    'stream',
    'website'
);


ALTER TYPE public.item_type OWNER TO tv;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: device; Type: TABLE; Schema: public; Owner: tv; Tablespace: 
--

CREATE TABLE device (
    id character varying NOT NULL,
    name character varying NOT NULL,
    program uuid,
    photo bytea,
    CONSTRAINT device_name_valid CHECK ((length((name)::text) > 0))
);


ALTER TABLE public.device OWNER TO tv;

--
-- Name: TABLE device; Type: COMMENT; Schema: public; Owner: tv
--

COMMENT ON TABLE device IS 'Device registry.';


--
-- Name: COLUMN device.id; Type: COMMENT; Schema: public; Owner: tv
--

COMMENT ON COLUMN device.id IS 'We assume that every device uses an unique identifier for communication with the `leader`. This will probably be a `hostname` or machine `uuid`.';


--
-- Name: COLUMN device.name; Type: COMMENT; Schema: public; Owner: tv
--

COMMENT ON COLUMN device.name IS 'Short, descriptive name of the device.';


--
-- Name: COLUMN device.program; Type: COMMENT; Schema: public; Owner: tv
--

COMMENT ON COLUMN device.program IS 'Every device can participate in at most a single programming. Devices sharing the same program should, ideally, present the same content at the same time.';


--
-- Name: COLUMN device.photo; Type: COMMENT; Schema: public; Owner: tv
--

COMMENT ON COLUMN device.photo IS 'Optional JPEG photography of the device for user to get a better idea when assigning programs.';


--
-- Name: event; Type: TABLE; Schema: public; Owner: tv; Tablespace: 
--

CREATE TABLE event (
    uuid uuid DEFAULT uuid_generate_v4() NOT NULL,
    program uuid NOT NULL,
    playlist uuid NOT NULL,
    date date NOT NULL,
    range int4range NOT NULL,
    CONSTRAINT event_range_valid CHECK ((int4range(0, 86400) @> range))
);


ALTER TABLE public.event OWNER TO tv;

--
-- Name: TABLE event; Type: COMMENT; Schema: public; Owner: tv
--

COMMENT ON TABLE event IS 'Ad-hoc programming segment.';


--
-- Name: COLUMN event.date; Type: COMMENT; Schema: public; Owner: tv
--

COMMENT ON COLUMN event.date IS 'A specific calendar date.';


--
-- Name: COLUMN event.range; Type: COMMENT; Schema: public; Owner: tv
--

COMMENT ON COLUMN event.range IS 'Range in seconds of that particular day when the event is to be played.';


--
-- Name: item; Type: TABLE; Schema: public; Owner: tv; Tablespace: 
--

CREATE TABLE item (
    uuid uuid DEFAULT uuid_generate_v4() NOT NULL,
    playlist uuid NOT NULL,
    path character varying NOT NULL,
    duration integer NOT NULL,
    "position" integer NOT NULL,
    preview bytea NOT NULL,
    type item_type NOT NULL,
    CONSTRAINT item_path_valid CHECK ((length((path)::text) > 0)),
    CONSTRAINT item_position_valid CHECK (("position" >= 0))
);


ALTER TABLE public.item OWNER TO tv;

--
-- Name: TABLE item; Type: COMMENT; Schema: public; Owner: tv
--

COMMENT ON TABLE item IS 'Single programming item that must be a part of a playlist.';


--
-- Name: COLUMN item.path; Type: COMMENT; Schema: public; Owner: tv
--

COMMENT ON COLUMN item.path IS 'Relative path to a local video item or URL.';


--
-- Name: COLUMN item.duration; Type: COMMENT; Schema: public; Owner: tv
--

COMMENT ON COLUMN item.duration IS 'Number of seconds the item takes to play back.';


--
-- Name: COLUMN item."position"; Type: COMMENT; Schema: public; Owner: tv
--

COMMENT ON COLUMN item."position" IS 'Position in the playlist.';


--
-- Name: COLUMN item.preview; Type: COMMENT; Schema: public; Owner: tv
--

COMMENT ON COLUMN item.preview IS 'A single low-res JPEG frame for the user.';


--
-- Name: COLUMN item.type; Type: COMMENT; Schema: public; Owner: tv
--

COMMENT ON COLUMN item.type IS 'Type of the item for proper playback pipeline construction.';


--
-- Name: playlist; Type: TABLE; Schema: public; Owner: tv; Tablespace: 
--

CREATE TABLE playlist (
    uuid uuid DEFAULT uuid_generate_v4() NOT NULL,
    name character varying NOT NULL,
    CONSTRAINT playlist_name_valid CHECK ((length((name)::text) > 0))
);


ALTER TABLE public.playlist OWNER TO tv;

--
-- Name: TABLE playlist; Type: COMMENT; Schema: public; Owner: tv
--

COMMENT ON TABLE playlist IS 'Group of programming items.';


--
-- Name: program; Type: TABLE; Schema: public; Owner: tv; Tablespace: 
--

CREATE TABLE program (
    uuid uuid DEFAULT uuid_generate_v4() NOT NULL,
    name character varying NOT NULL,
    CONSTRAINT program_name_valid CHECK ((length((name)::text) > 0))
);


ALTER TABLE public.program OWNER TO tv;

--
-- Name: TABLE program; Type: COMMENT; Schema: public; Owner: tv
--

COMMENT ON TABLE program IS 'Group of segments and events that devices can be associated with.';


--
-- Name: segment; Type: TABLE; Schema: public; Owner: tv; Tablespace: 
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


ALTER TABLE public.segment OWNER TO tv;

--
-- Name: TABLE segment; Type: COMMENT; Schema: public; Owner: tv
--

COMMENT ON TABLE segment IS 'Weekly schedule programming segment.';


--
-- Name: COLUMN segment.day; Type: COMMENT; Schema: public; Owner: tv
--

COMMENT ON COLUMN segment.day IS 'Day of the week when the segment is to be played. 0 = monday, 6 = sunday.';


--
-- Name: COLUMN segment.range; Type: COMMENT; Schema: public; Owner: tv
--

COMMENT ON COLUMN segment.range IS 'Range in seconds of that particular day when the event is to be played.';


--
-- Data for Name: device; Type: TABLE DATA; Schema: public; Owner: tv
--

COPY device (id, name, program, photo) FROM stdin;
\.


--
-- Data for Name: event; Type: TABLE DATA; Schema: public; Owner: tv
--

COPY event (uuid, program, playlist, date, range) FROM stdin;
\.


--
-- Data for Name: item; Type: TABLE DATA; Schema: public; Owner: tv
--

COPY item (uuid, playlist, path, duration, "position", preview, type) FROM stdin;
\.


--
-- Data for Name: playlist; Type: TABLE DATA; Schema: public; Owner: tv
--

COPY playlist (uuid, name) FROM stdin;
\.


--
-- Data for Name: program; Type: TABLE DATA; Schema: public; Owner: tv
--

COPY program (uuid, name) FROM stdin;
\.


--
-- Data for Name: segment; Type: TABLE DATA; Schema: public; Owner: tv
--

COPY segment (uuid, program, playlist, day, range) FROM stdin;
\.


--
-- Name: device_name_unique; Type: CONSTRAINT; Schema: public; Owner: tv; Tablespace: 
--

ALTER TABLE ONLY device
    ADD CONSTRAINT device_name_unique UNIQUE (name) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: device_pkey; Type: CONSTRAINT; Schema: public; Owner: tv; Tablespace: 
--

ALTER TABLE ONLY device
    ADD CONSTRAINT device_pkey PRIMARY KEY (id);


--
-- Name: event_pkey; Type: CONSTRAINT; Schema: public; Owner: tv; Tablespace: 
--

ALTER TABLE ONLY event
    ADD CONSTRAINT event_pkey PRIMARY KEY (uuid);


--
-- Name: event_program_date_range_excl; Type: CONSTRAINT; Schema: public; Owner: tv; Tablespace: 
--

ALTER TABLE ONLY event
    ADD CONSTRAINT event_program_date_range_excl EXCLUDE USING gist (((program)::text) WITH =, date WITH =, range WITH &&);


--
-- Name: item_pkey; Type: CONSTRAINT; Schema: public; Owner: tv; Tablespace: 
--

ALTER TABLE ONLY item
    ADD CONSTRAINT item_pkey PRIMARY KEY (uuid);


--
-- Name: item_playlist_position_unique; Type: CONSTRAINT; Schema: public; Owner: tv; Tablespace: 
--

ALTER TABLE ONLY item
    ADD CONSTRAINT item_playlist_position_unique UNIQUE (playlist, "position") DEFERRABLE INITIALLY DEFERRED;


--
-- Name: playlist_name_unique; Type: CONSTRAINT; Schema: public; Owner: tv; Tablespace: 
--

ALTER TABLE ONLY playlist
    ADD CONSTRAINT playlist_name_unique UNIQUE (name) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: playlist_pkey; Type: CONSTRAINT; Schema: public; Owner: tv; Tablespace: 
--

ALTER TABLE ONLY playlist
    ADD CONSTRAINT playlist_pkey PRIMARY KEY (uuid);


--
-- Name: program_name_unique; Type: CONSTRAINT; Schema: public; Owner: tv; Tablespace: 
--

ALTER TABLE ONLY program
    ADD CONSTRAINT program_name_unique UNIQUE (name) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: program_pkey; Type: CONSTRAINT; Schema: public; Owner: tv; Tablespace: 
--

ALTER TABLE ONLY program
    ADD CONSTRAINT program_pkey PRIMARY KEY (uuid);


--
-- Name: segment_pkey; Type: CONSTRAINT; Schema: public; Owner: tv; Tablespace: 
--

ALTER TABLE ONLY segment
    ADD CONSTRAINT segment_pkey PRIMARY KEY (uuid);


--
-- Name: segment_program_day_range_excl; Type: CONSTRAINT; Schema: public; Owner: tv; Tablespace: 
--

ALTER TABLE ONLY segment
    ADD CONSTRAINT segment_program_day_range_excl EXCLUDE USING gist (((program)::text) WITH =, day WITH =, range WITH &&);


--
-- Name: fki_device_program_pkey; Type: INDEX; Schema: public; Owner: tv; Tablespace: 
--

CREATE INDEX fki_device_program_pkey ON device USING btree (program);


--
-- Name: fki_event_playlist_fkey; Type: INDEX; Schema: public; Owner: tv; Tablespace: 
--

CREATE INDEX fki_event_playlist_fkey ON event USING btree (playlist);


--
-- Name: fki_event_program_fkey; Type: INDEX; Schema: public; Owner: tv; Tablespace: 
--

CREATE INDEX fki_event_program_fkey ON event USING btree (program);


--
-- Name: fki_segment_playlist_fkey; Type: INDEX; Schema: public; Owner: tv; Tablespace: 
--

CREATE INDEX fki_segment_playlist_fkey ON segment USING btree (playlist);


--
-- Name: fki_segment_program_fkey; Type: INDEX; Schema: public; Owner: tv; Tablespace: 
--

CREATE INDEX fki_segment_program_fkey ON segment USING btree (program);


--
-- Name: device_program_pkey; Type: FK CONSTRAINT; Schema: public; Owner: tv
--

ALTER TABLE ONLY device
    ADD CONSTRAINT device_program_pkey FOREIGN KEY (program) REFERENCES program(uuid) ON UPDATE CASCADE ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;


--
-- Name: event_playlist_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tv
--

ALTER TABLE ONLY event
    ADD CONSTRAINT event_playlist_fkey FOREIGN KEY (playlist) REFERENCES playlist(uuid) ON UPDATE CASCADE ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;


--
-- Name: event_program_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tv
--

ALTER TABLE ONLY event
    ADD CONSTRAINT event_program_fkey FOREIGN KEY (program) REFERENCES program(uuid) ON UPDATE CASCADE ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;


--
-- Name: item_playlist_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tv
--

ALTER TABLE ONLY item
    ADD CONSTRAINT item_playlist_fkey FOREIGN KEY (playlist) REFERENCES playlist(uuid) ON UPDATE CASCADE ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;


--
-- Name: segment_playlist_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tv
--

ALTER TABLE ONLY segment
    ADD CONSTRAINT segment_playlist_fkey FOREIGN KEY (playlist) REFERENCES playlist(uuid) ON UPDATE CASCADE ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;


--
-- Name: segment_program_fkey; Type: FK CONSTRAINT; Schema: public; Owner: tv
--

ALTER TABLE ONLY segment
    ADD CONSTRAINT segment_program_fkey FOREIGN KEY (program) REFERENCES program(uuid) ON UPDATE CASCADE ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;


--
-- Name: public; Type: ACL; Schema: -; Owner: tv
--

REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM tv;
GRANT ALL ON SCHEMA public TO tv;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--

