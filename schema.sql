--
-- PostgreSQL database dump
--

-- Dumped from database version 9.5.4
-- Dumped by pg_dump version 9.5.4

-- Started on 2016-10-04 23:54:21 CEST

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 1 (class 3079 OID 12362)
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- TOC entry 2446 (class 0 OID 0)
-- Dependencies: 1
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


--
-- TOC entry 3 (class 3079 OID 16394)
-- Name: btree_gist; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;


--
-- TOC entry 2447 (class 0 OID 0)
-- Dependencies: 3
-- Name: EXTENSION btree_gist; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION btree_gist IS 'support for indexing common datatypes in GiST';


--
-- TOC entry 2 (class 3079 OID 16948)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- TOC entry 2448 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET search_path = public, pg_catalog;

--
-- TOC entry 743 (class 1247 OID 16960)
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
-- TOC entry 371 (class 1255 OID 17218)
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
-- TOC entry 373 (class 1255 OID 17219)
-- Name: file_changed(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION file_changed() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE row record;
BEGIN
	FOR row IN SELECT uuid, duration FROM item WHERE file = NEW.uuid
	LOOP
		-- CALL all records, because we want to touch trigger UPDATE on item
		UPDATE item SET duration = MIN(NEW.duration, row.duration) WHERE uuid = row.uuid;
	END LOOP;
 RETURN NEW;
END;
$$;


ALTER FUNCTION public.file_changed() OWNER TO postgres;

--
-- TOC entry 372 (class 1255 OID 17220)
-- Name: item_changed(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION item_changed() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
 -- PASS all as is
 RETURN NEW;
END;
$$;


ALTER FUNCTION public.item_changed() OWNER TO postgres;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- TOC entry 189 (class 1259 OID 17139)
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
-- TOC entry 183 (class 1259 OID 16976)
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
-- TOC entry 2449 (class 0 OID 0)
-- Dependencies: 183
-- Name: TABLE event; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE event IS 'Ad-hoc programming segment.';


--
-- TOC entry 2450 (class 0 OID 0)
-- Dependencies: 183
-- Name: COLUMN event.date; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN event.date IS 'A specific calendar date.';


--
-- TOC entry 2451 (class 0 OID 0)
-- Dependencies: 183
-- Name: COLUMN event.range; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN event.range IS 'Range in seconds of that particular day when the event is to be played.';


--
-- TOC entry 188 (class 1259 OID 17108)
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
-- TOC entry 2452 (class 0 OID 0)
-- Dependencies: 188
-- Name: COLUMN file.uuid; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN file.uuid IS 'Simple identificator of file';


--
-- TOC entry 2453 (class 0 OID 0)
-- Dependencies: 188
-- Name: COLUMN file.path; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN file.path IS 'Identificator of file';


--
-- TOC entry 2454 (class 0 OID 0)
-- Dependencies: 188
-- Name: COLUMN file.hash; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN file.hash IS 'Hash of file';


--
-- TOC entry 2455 (class 0 OID 0)
-- Dependencies: 188
-- Name: COLUMN file.type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN file.type IS 'file type
0 - unknown
1 - video
2 - picture';


--
-- TOC entry 2456 (class 0 OID 0)
-- Dependencies: 188
-- Name: COLUMN file.duration; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN file.duration IS 'duration in second';


--
-- TOC entry 2457 (class 0 OID 0)
-- Dependencies: 188
-- Name: COLUMN file.name; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN file.name IS 'filename';


--
-- TOC entry 2458 (class 0 OID 0)
-- Dependencies: 188
-- Name: COLUMN file.preview; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN file.preview IS 'preview of file (if is video)';


--
-- TOC entry 184 (class 1259 OID 16984)
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
-- TOC entry 2459 (class 0 OID 0)
-- Dependencies: 184
-- Name: TABLE item; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE item IS 'Single programming item that must be a part of a playlist.';


--
-- TOC entry 2460 (class 0 OID 0)
-- Dependencies: 184
-- Name: COLUMN item.duration; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN item.duration IS 'Number of seconds the item takes to play back.';


--
-- TOC entry 2461 (class 0 OID 0)
-- Dependencies: 184
-- Name: COLUMN item."position"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN item."position" IS 'Position in the playlist.';


--
-- TOC entry 185 (class 1259 OID 16993)
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
-- TOC entry 2462 (class 0 OID 0)
-- Dependencies: 185
-- Name: TABLE playlist; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE playlist IS 'Group of programming items.';


--
-- TOC entry 186 (class 1259 OID 17001)
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
-- TOC entry 2463 (class 0 OID 0)
-- Dependencies: 186
-- Name: TABLE program; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE program IS 'Group of segments and events that devices can be associated with.';


--
-- TOC entry 190 (class 1259 OID 17203)
-- Name: reservation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE reservation (
    room integer,
    during tsrange
);


ALTER TABLE reservation OWNER TO postgres;

--
-- TOC entry 187 (class 1259 OID 17009)
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
-- TOC entry 2464 (class 0 OID 0)
-- Dependencies: 187
-- Name: TABLE segment; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE segment IS 'Weekly schedule programming segment.';


--
-- TOC entry 2465 (class 0 OID 0)
-- Dependencies: 187
-- Name: COLUMN segment.day; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN segment.day IS 'Day of the week when the segment is to be played. 0 = monday, 6 = sunday.';


--
-- TOC entry 2466 (class 0 OID 0)
-- Dependencies: 187
-- Name: COLUMN segment.range; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN segment.range IS 'Range in seconds of that particular day when the event is to be played.';


--
-- TOC entry 2315 (class 2606 OID 17148)
-- Name: device_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY device
    ADD CONSTRAINT device_pkey PRIMARY KEY (id);


--
-- TOC entry 2287 (class 2606 OID 17024)
-- Name: event_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY event
    ADD CONSTRAINT event_pkey PRIMARY KEY (uuid);


--
-- TOC entry 2289 (class 2606 OID 17026)
-- Name: event_program_date_range_excl; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY event
    ADD CONSTRAINT event_program_date_range_excl EXCLUDE USING gist (((program)::text) WITH =, date WITH =, range WITH &&);


--
-- TOC entry 2311 (class 2606 OID 17118)
-- Name: file_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY file
    ADD CONSTRAINT file_pkey PRIMARY KEY (uuid);


--
-- TOC entry 2313 (class 2606 OID 17190)
-- Name: file_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY file
    ADD CONSTRAINT file_unique UNIQUE (path);


--
-- TOC entry 2293 (class 2606 OID 17028)
-- Name: item_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY item
    ADD CONSTRAINT item_pkey PRIMARY KEY (uuid);


--
-- TOC entry 2295 (class 2606 OID 17030)
-- Name: item_playlist_position_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY item
    ADD CONSTRAINT item_playlist_position_unique UNIQUE (playlist, "position") DEFERRABLE INITIALLY DEFERRED;


--
-- TOC entry 2297 (class 2606 OID 17033)
-- Name: playlist_name_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY playlist
    ADD CONSTRAINT playlist_name_unique UNIQUE (name) DEFERRABLE INITIALLY DEFERRED;


--
-- TOC entry 2299 (class 2606 OID 17036)
-- Name: playlist_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY playlist
    ADD CONSTRAINT playlist_pkey PRIMARY KEY (uuid);


--
-- TOC entry 2301 (class 2606 OID 17038)
-- Name: program_name_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY program
    ADD CONSTRAINT program_name_unique UNIQUE (name) DEFERRABLE INITIALLY DEFERRED;


--
-- TOC entry 2303 (class 2606 OID 17041)
-- Name: program_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY program
    ADD CONSTRAINT program_pkey PRIMARY KEY (uuid);


--
-- TOC entry 2307 (class 2606 OID 17043)
-- Name: segment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY segment
    ADD CONSTRAINT segment_pkey PRIMARY KEY (uuid);


--
-- TOC entry 2309 (class 2606 OID 17045)
-- Name: segment_program_day_range_excl; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY segment
    ADD CONSTRAINT segment_program_day_range_excl EXCLUDE USING gist (((program)::text) WITH =, day WITH =, range WITH &&);


--
-- TOC entry 2316 (class 1259 OID 17154)
-- Name: fki_device_program_pkey; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX fki_device_program_pkey ON device USING btree (program);


--
-- TOC entry 2290 (class 1259 OID 17047)
-- Name: fki_event_playlist_fkey; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX fki_event_playlist_fkey ON event USING btree (playlist);


--
-- TOC entry 2291 (class 1259 OID 17048)
-- Name: fki_event_program_fkey; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX fki_event_program_fkey ON event USING btree (program);


--
-- TOC entry 2304 (class 1259 OID 17049)
-- Name: fki_segment_playlist_fkey; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX fki_segment_playlist_fkey ON segment USING btree (playlist);


--
-- TOC entry 2305 (class 1259 OID 17050)
-- Name: fki_segment_program_fkey; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX fki_segment_program_fkey ON segment USING btree (program);


--
-- TOC entry 2324 (class 2620 OID 17231)
-- Name: file_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER file_trigger AFTER INSERT OR UPDATE ON file FOR EACH ROW EXECUTE PROCEDURE file_changed();


--
-- TOC entry 2323 (class 2606 OID 17149)
-- Name: device_program_pkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY device
    ADD CONSTRAINT device_program_pkey FOREIGN KEY (program) REFERENCES program(uuid) ON UPDATE CASCADE ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;


--
-- TOC entry 2317 (class 2606 OID 17056)
-- Name: event_playlist_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY event
    ADD CONSTRAINT event_playlist_fkey FOREIGN KEY (playlist) REFERENCES playlist(uuid) ON UPDATE CASCADE ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;


--
-- TOC entry 2318 (class 2606 OID 17061)
-- Name: event_program_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY event
    ADD CONSTRAINT event_program_fkey FOREIGN KEY (program) REFERENCES program(uuid) ON UPDATE CASCADE ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;


--
-- TOC entry 2320 (class 2606 OID 17121)
-- Name: file_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY item
    ADD CONSTRAINT file_fkey FOREIGN KEY (file) REFERENCES file(uuid);


--
-- TOC entry 2319 (class 2606 OID 17066)
-- Name: item_playlist_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY item
    ADD CONSTRAINT item_playlist_fkey FOREIGN KEY (playlist) REFERENCES playlist(uuid) ON UPDATE CASCADE ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;


--
-- TOC entry 2321 (class 2606 OID 17071)
-- Name: segment_playlist_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY segment
    ADD CONSTRAINT segment_playlist_fkey FOREIGN KEY (playlist) REFERENCES playlist(uuid) ON UPDATE CASCADE ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;


--
-- TOC entry 2322 (class 2606 OID 17076)
-- Name: segment_program_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY segment
    ADD CONSTRAINT segment_program_fkey FOREIGN KEY (program) REFERENCES program(uuid) ON UPDATE CASCADE ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;


--
-- TOC entry 2445 (class 0 OID 0)
-- Dependencies: 9
-- Name: public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM postgres;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO PUBLIC;


-- Completed on 2016-10-04 23:54:21 CEST

--
-- PostgreSQL database dump complete
--

