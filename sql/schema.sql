--
-- PostgreSQL database dump
--

-- Dumped from database version 9.5.5
-- Dumped by pg_dump version 9.5.5

SET statement_timeout = 0;
SET lock_timeout = 0;
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
-- Name: file_type; Type: TYPE; Schema: public; Owner: indoktrinator
--

CREATE TYPE file_type AS ENUM (
    'video',
    'image',
    'website'
);


ALTER TYPE file_type OWNER TO indoktrinator;

--
-- Name: TYPE file_type; Type: COMMENT; Schema: public; Owner: indoktrinator
--

COMMENT ON TYPE file_type IS 'Type of the media file.';


--
-- Name: layout_mode; Type: TYPE; Schema: public; Owner: indoktrinator
--

CREATE TYPE layout_mode AS ENUM (
    'full',
    'sidebar',
    'panel'
);


ALTER TYPE layout_mode OWNER TO indoktrinator;

--
-- Name: changelog(); Type: FUNCTION; Schema: public; Owner: indoktrinator
--

CREATE FUNCTION changelog() RETURNS trigger
    LANGUAGE plpgsql
    AS $$DECLARE
	oldjson jsonb;
	newjson jsonb;
	cname text;

BEGIN
	oldjson := '{}'::jsonb;
	newjson := '{}'::jsonb;

	IF TG_OP <> 'INSERT' THEN
		oldjson := row_to_json(OLD);
	END IF;

	IF TG_OP <> 'DELETE' THEN
		newjson := row_to_json(NEW);
	END IF;

	FOR cname
	IN SELECT cname FROM information_schema.columns
		WHERE table_schema = TG_TABLE_SCHEMA
		  AND table_name = TG_TABLE_NAME
		  AND data_type = 'bytea'
	LOOP
		oldjson := oldjson - cname;
		newjson := newjson - cname;
	END LOOP;

	IF oldjson = '{}'::jsonb THEN
		oldjson := NULL;
	END IF;

	IF newjson = '{}'::jsonb THEN
		newjson := NULL;
	END IF;

	PERFORM pg_notify('changelog', json_build_array(txid_current(), TG_TABLE_NAME, oldjson, newjson)::text);
	RETURN NEW;
END;$$;


ALTER FUNCTION public.changelog() OWNER TO indoktrinator;

--
-- Name: update_item_durations(); Type: FUNCTION; Schema: public; Owner: indoktrinator
--

CREATE FUNCTION update_item_durations() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
	UPDATE item SET duration = file.duration
	FROM file WHERE item.file = file.uuid;
	RETURN NEW;
END;$$;


ALTER FUNCTION public.update_item_durations() OWNER TO indoktrinator;

--
-- Name: update_playlist_durations(); Type: FUNCTION; Schema: public; Owner: indoktrinator
--

CREATE FUNCTION update_playlist_durations() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
	UPDATE playlist SET duration = items.duration
	FROM (
		SELECT item.playlist, SUM(item.duration) AS duration
		FROM item GROUP BY item.playlist
	) AS items
	WHERE items.playlist = playlist.uuid;
	RETURN NEW;
END;$$;


ALTER FUNCTION public.update_playlist_durations() OWNER TO indoktrinator;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: device; Type: TABLE; Schema: public; Owner: indoktrinator
--

CREATE TABLE device (
    id character varying(127) NOT NULL,
    name character varying(127) NOT NULL,
    program uuid,
    photo bytea,
    online boolean DEFAULT false NOT NULL,
    power boolean DEFAULT false NOT NULL,
    CONSTRAINT name_valid CHECK ((length((name)::text) > 0))
);


ALTER TABLE device OWNER TO indoktrinator;

--
-- Name: COLUMN device.id; Type: COMMENT; Schema: public; Owner: indoktrinator
--

COMMENT ON COLUMN device.id IS 'Unique identifier of the device from `/etc/machine-id`.';


--
-- Name: COLUMN device.name; Type: COMMENT; Schema: public; Owner: indoktrinator
--

COMMENT ON COLUMN device.name IS 'Human-readable machine name.';


--
-- Name: COLUMN device.program; Type: COMMENT; Schema: public; Owner: indoktrinator
--

COMMENT ON COLUMN device.program IS 'Program the device has been assigned to play.';


--
-- Name: COLUMN device.photo; Type: COMMENT; Schema: public; Owner: indoktrinator
--

COMMENT ON COLUMN device.photo IS 'Image of the device for better user experience. A JPEG sized 500x500 pixels.';


--
-- Name: COLUMN device.online; Type: COMMENT; Schema: public; Owner: indoktrinator
--

COMMENT ON COLUMN device.online IS 'FIXME: Delete this column.';


--
-- Name: COLUMN device.power; Type: COMMENT; Schema: public; Owner: indoktrinator
--

COMMENT ON COLUMN device.power IS 'FIXME: Delete this column.';


--
-- Name: device_photo; Type: TABLE; Schema: public; Owner: indoktrinator
--

CREATE TABLE device_photo (
    id character varying(127) NOT NULL,
    photo bytea NOT NULL,
    mime character varying(127) DEFAULT 'image/jpeg'::character varying
);


ALTER TABLE device_photo OWNER TO indoktrinator;

--
-- Name: TABLE device_photo; Type: COMMENT; Schema: public; Owner: indoktrinator
--

COMMENT ON TABLE device_photo IS 'Device photos stored in the database.';


--
-- Name: COLUMN device_photo.id; Type: COMMENT; Schema: public; Owner: indoktrinator
--

COMMENT ON COLUMN device_photo.id IS 'Unique identifier of the device matching that of `device.id`.';


--
-- Name: COLUMN device_photo.photo; Type: COMMENT; Schema: public; Owner: indoktrinator
--

COMMENT ON COLUMN device_photo.photo IS 'Binary data of the uploaded photo.';


--
-- Name: COLUMN device_photo.mime; Type: COMMENT; Schema: public; Owner: indoktrinator
--

COMMENT ON COLUMN device_photo.mime IS 'MIME type for the binary image data.';


--
-- Name: event; Type: TABLE; Schema: public; Owner: indoktrinator
--

CREATE TABLE event (
    uuid uuid DEFAULT uuid_generate_v4() NOT NULL,
    program uuid NOT NULL,
    playlist uuid NOT NULL,
    date date NOT NULL,
    range int4range NOT NULL,
    CONSTRAINT event_range_bounds_valid CHECK ((lower_inc(range) AND (NOT upper_inc(range)))),
    CONSTRAINT event_range_valid CHECK ((int4range(0, 86400) @> range))
);


ALTER TABLE event OWNER TO indoktrinator;

--
-- Name: TABLE event; Type: COMMENT; Schema: public; Owner: indoktrinator
--

COMMENT ON TABLE event IS 'Ad-hoc programming segment.';


--
-- Name: COLUMN event.program; Type: COMMENT; Schema: public; Owner: indoktrinator
--

COMMENT ON COLUMN event.program IS 'Program this event is a part of.';


--
-- Name: COLUMN event.playlist; Type: COMMENT; Schema: public; Owner: indoktrinator
--

COMMENT ON COLUMN event.playlist IS 'Playlist of items to schedule for this event.';


--
-- Name: COLUMN event.date; Type: COMMENT; Schema: public; Owner: indoktrinator
--

COMMENT ON COLUMN event.date IS 'A specific calendar date.';


--
-- Name: COLUMN event.range; Type: COMMENT; Schema: public; Owner: indoktrinator
--

COMMENT ON COLUMN event.range IS 'Range in seconds of that particular day when the event is to be played.';


--
-- Name: file; Type: TABLE; Schema: public; Owner: indoktrinator
--

CREATE TABLE file (
    uuid uuid DEFAULT uuid_generate_v4() NOT NULL,
    path character varying(1023) NOT NULL,
    token character varying(63) NOT NULL,
    duration real NOT NULL,
    preview bytea,
    type file_type DEFAULT 'video'::file_type NOT NULL
);


ALTER TABLE file OWNER TO indoktrinator;

--
-- Name: TABLE file; Type: COMMENT; Schema: public; Owner: indoktrinator
--

COMMENT ON TABLE file IS 'File located in the media library.';


--
-- Name: COLUMN file.path; Type: COMMENT; Schema: public; Owner: indoktrinator
--

COMMENT ON COLUMN file.path IS 'Path to the file, relative to the root of the media library.';


--
-- Name: COLUMN file.token; Type: COMMENT; Schema: public; Owner: indoktrinator
--

COMMENT ON COLUMN file.token IS 'Token for unique identification of the file.';


--
-- Name: COLUMN file.duration; Type: COMMENT; Schema: public; Owner: indoktrinator
--

COMMENT ON COLUMN file.duration IS 'Duration of the file playback in seconds.';


--
-- Name: COLUMN file.preview; Type: COMMENT; Schema: public; Owner: indoktrinator
--

COMMENT ON COLUMN file.preview IS 'Image preview for the file. A JPEG with dimensions of 160x90 pixels.';


--
-- Name: file_preview; Type: TABLE; Schema: public; Owner: indoktrinator
--

CREATE TABLE file_preview (
    uuid uuid NOT NULL,
    preview bytea NOT NULL,
    mime character varying(127) DEFAULT 'image/jpeg'::character varying NOT NULL
);


ALTER TABLE file_preview OWNER TO indoktrinator;

--
-- Name: COLUMN file_preview.uuid; Type: COMMENT; Schema: public; Owner: indoktrinator
--

COMMENT ON COLUMN file_preview.uuid IS 'Unique identifier of the file, matching that of `file.uuid`.';


--
-- Name: COLUMN file_preview.preview; Type: COMMENT; Schema: public; Owner: indoktrinator
--

COMMENT ON COLUMN file_preview.preview IS 'Binary data of the extracted preview image.';


--
-- Name: COLUMN file_preview.mime; Type: COMMENT; Schema: public; Owner: indoktrinator
--

COMMENT ON COLUMN file_preview.mime IS 'MIME type for the binary image data.';


--
-- Name: item; Type: TABLE; Schema: public; Owner: indoktrinator
--

CREATE TABLE item (
    uuid uuid DEFAULT uuid_generate_v4() NOT NULL,
    playlist uuid NOT NULL,
    "position" integer NOT NULL,
    file uuid NOT NULL,
    duration real NOT NULL
);


ALTER TABLE item OWNER TO indoktrinator;

--
-- Name: TABLE item; Type: COMMENT; Schema: public; Owner: indoktrinator
--

COMMENT ON TABLE item IS 'Items link files to playlists.';


--
-- Name: COLUMN item.playlist; Type: COMMENT; Schema: public; Owner: indoktrinator
--

COMMENT ON COLUMN item.playlist IS 'Playlist this item is a part of.';


--
-- Name: COLUMN item."position"; Type: COMMENT; Schema: public; Owner: indoktrinator
--

COMMENT ON COLUMN item."position" IS 'Position in the playlist.';


--
-- Name: COLUMN item.file; Type: COMMENT; Schema: public; Owner: indoktrinator
--

COMMENT ON COLUMN item.file IS 'Actual file from the media library.';


--
-- Name: COLUMN item.duration; Type: COMMENT; Schema: public; Owner: indoktrinator
--

COMMENT ON COLUMN item.duration IS 'Duration of the item. Automatically set from the duration of the referenced file.';


--
-- Name: playlist; Type: TABLE; Schema: public; Owner: indoktrinator
--

CREATE TABLE playlist (
    uuid uuid DEFAULT uuid_generate_v4() NOT NULL,
    name character varying(127) NOT NULL,
    path character varying(127),
    token character varying(63),
    duration real DEFAULT 0.0 NOT NULL,
    CONSTRAINT playlist_name_valid CHECK ((length((name)::text) > 0))
);


ALTER TABLE playlist OWNER TO indoktrinator;

--
-- Name: TABLE playlist; Type: COMMENT; Schema: public; Owner: indoktrinator
--

COMMENT ON TABLE playlist IS 'Group of programming items.';


--
-- Name: COLUMN playlist.name; Type: COMMENT; Schema: public; Owner: indoktrinator
--

COMMENT ON COLUMN playlist.name IS 'Descriptive name of the playlist.';


--
-- Name: COLUMN playlist.path; Type: COMMENT; Schema: public; Owner: indoktrinator
--

COMMENT ON COLUMN playlist.path IS 'Path to the playlist, relative to the root of the media library.';


--
-- Name: COLUMN playlist.token; Type: COMMENT; Schema: public; Owner: indoktrinator
--

COMMENT ON COLUMN playlist.token IS 'Unique identifier for playlists stored in the media library. Virtual playlists do not have one.';


--
-- Name: program; Type: TABLE; Schema: public; Owner: indoktrinator
--

CREATE TABLE program (
    uuid uuid DEFAULT uuid_generate_v4() NOT NULL,
    name character varying(127) NOT NULL,
    CONSTRAINT program_name_valid CHECK ((length((name)::text) > 0))
);


ALTER TABLE program OWNER TO indoktrinator;

--
-- Name: TABLE program; Type: COMMENT; Schema: public; Owner: indoktrinator
--

COMMENT ON TABLE program IS 'Group of segments and events that devices can be associated with.';


--
-- Name: COLUMN program.name; Type: COMMENT; Schema: public; Owner: indoktrinator
--

COMMENT ON COLUMN program.name IS 'Descriptive name of the program.';


--
-- Name: segment; Type: TABLE; Schema: public; Owner: indoktrinator
--

CREATE TABLE segment (
    uuid uuid DEFAULT uuid_generate_v4() NOT NULL,
    program uuid NOT NULL,
    playlist uuid NOT NULL,
    day integer NOT NULL,
    range int4range NOT NULL,
    sidebar character varying(1023),
    panel character varying(1023),
    mode layout_mode DEFAULT 'full'::layout_mode NOT NULL,
    CONSTRAINT day_valid CHECK (((day >= 0) AND (day <= 6))),
    CONSTRAINT layout_fields_valid CHECK ((((mode = 'full'::layout_mode) AND (sidebar IS NULL) AND (panel IS NULL)) OR ((mode = 'sidebar'::layout_mode) AND (sidebar IS NOT NULL) AND (panel IS NULL)) OR ((mode = 'panel'::layout_mode) AND (sidebar IS NOT NULL) AND (panel IS NOT NULL)))),
    CONSTRAINT range_bounds_valid CHECK ((lower_inc(range) AND (NOT upper_inc(range)))),
    CONSTRAINT range_valid CHECK ((int4range(0, 86400) @> range))
);


ALTER TABLE segment OWNER TO indoktrinator;

--
-- Name: TABLE segment; Type: COMMENT; Schema: public; Owner: indoktrinator
--

COMMENT ON TABLE segment IS 'Weekly schedule programming segment.';


--
-- Name: COLUMN segment.program; Type: COMMENT; Schema: public; Owner: indoktrinator
--

COMMENT ON COLUMN segment.program IS 'Program this segment is a part of.';


--
-- Name: COLUMN segment.playlist; Type: COMMENT; Schema: public; Owner: indoktrinator
--

COMMENT ON COLUMN segment.playlist IS 'Playlist of items to schedule for this segment.';


--
-- Name: COLUMN segment.day; Type: COMMENT; Schema: public; Owner: indoktrinator
--

COMMENT ON COLUMN segment.day IS 'Day of the week when the segment is to be played. 0 = monday, 6 = sunday.';


--
-- Name: COLUMN segment.range; Type: COMMENT; Schema: public; Owner: indoktrinator
--

COMMENT ON COLUMN segment.range IS 'Range in seconds of that particular day when the event is to be played.';


--
-- Name: COLUMN segment.sidebar; Type: COMMENT; Schema: public; Owner: indoktrinator
--

COMMENT ON COLUMN segment.sidebar IS 'URL for the Sidebar';


--
-- Name: COLUMN segment.panel; Type: COMMENT; Schema: public; Owner: indoktrinator
--

COMMENT ON COLUMN segment.panel IS 'URI for the Panel';


--
-- Name: COLUMN segment.mode; Type: COMMENT; Schema: public; Owner: indoktrinator
--

COMMENT ON COLUMN segment.mode IS 'Layout of the screen for the duration of this segment.';


--
-- Data for Name: device; Type: TABLE DATA; Schema: public; Owner: indoktrinator
--

COPY device (id, name, program, photo, online, power) FROM stdin;
\.


--
-- Data for Name: device_photo; Type: TABLE DATA; Schema: public; Owner: indoktrinator
--

COPY device_photo (id, photo, mime) FROM stdin;
\.


--
-- Data for Name: event; Type: TABLE DATA; Schema: public; Owner: indoktrinator
--

COPY event (uuid, program, playlist, date, range) FROM stdin;
\.


--
-- Data for Name: file; Type: TABLE DATA; Schema: public; Owner: indoktrinator
--

COPY file (uuid, path, token, duration, preview, type) FROM stdin;
\.


--
-- Data for Name: file_preview; Type: TABLE DATA; Schema: public; Owner: indoktrinator
--

COPY file_preview (uuid, preview, mime) FROM stdin;
\.


--
-- Data for Name: item; Type: TABLE DATA; Schema: public; Owner: indoktrinator
--

COPY item (uuid, playlist, "position", file, duration) FROM stdin;
\.


--
-- Data for Name: playlist; Type: TABLE DATA; Schema: public; Owner: indoktrinator
--

COPY playlist (uuid, name, path, token, duration) FROM stdin;
\.


--
-- Data for Name: program; Type: TABLE DATA; Schema: public; Owner: indoktrinator
--

COPY program (uuid, name) FROM stdin;
\.


--
-- Data for Name: segment; Type: TABLE DATA; Schema: public; Owner: indoktrinator
--

COPY segment (uuid, program, playlist, day, range, sidebar, panel, mode) FROM stdin;
\.


--
-- Name: device_photo_pkey; Type: CONSTRAINT; Schema: public; Owner: indoktrinator
--

ALTER TABLE ONLY device_photo
    ADD CONSTRAINT device_photo_pkey PRIMARY KEY (id);


--
-- Name: device_pkey; Type: CONSTRAINT; Schema: public; Owner: indoktrinator
--

ALTER TABLE ONLY device
    ADD CONSTRAINT device_pkey PRIMARY KEY (id);


--
-- Name: event_no_overlap; Type: CONSTRAINT; Schema: public; Owner: indoktrinator
--

ALTER TABLE ONLY event
    ADD CONSTRAINT event_no_overlap EXCLUDE USING gist (date WITH =, range WITH &&);


--
-- Name: event_pkey; Type: CONSTRAINT; Schema: public; Owner: indoktrinator
--

ALTER TABLE ONLY event
    ADD CONSTRAINT event_pkey PRIMARY KEY (uuid);


--
-- Name: file_path_unique; Type: CONSTRAINT; Schema: public; Owner: indoktrinator
--

ALTER TABLE ONLY file
    ADD CONSTRAINT file_path_unique UNIQUE (path) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: file_pkey; Type: CONSTRAINT; Schema: public; Owner: indoktrinator
--

ALTER TABLE ONLY file
    ADD CONSTRAINT file_pkey PRIMARY KEY (uuid);


--
-- Name: file_preview_pkey; Type: CONSTRAINT; Schema: public; Owner: indoktrinator
--

ALTER TABLE ONLY file_preview
    ADD CONSTRAINT file_preview_pkey PRIMARY KEY (uuid);


--
-- Name: file_token_unique; Type: CONSTRAINT; Schema: public; Owner: indoktrinator
--

ALTER TABLE ONLY file
    ADD CONSTRAINT file_token_unique UNIQUE (token);


--
-- Name: item_pkey; Type: CONSTRAINT; Schema: public; Owner: indoktrinator
--

ALTER TABLE ONLY item
    ADD CONSTRAINT item_pkey PRIMARY KEY (uuid);


--
-- Name: playlist_path_unique; Type: CONSTRAINT; Schema: public; Owner: indoktrinator
--

ALTER TABLE ONLY playlist
    ADD CONSTRAINT playlist_path_unique UNIQUE (path) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: playlist_pkey; Type: CONSTRAINT; Schema: public; Owner: indoktrinator
--

ALTER TABLE ONLY playlist
    ADD CONSTRAINT playlist_pkey PRIMARY KEY (uuid);


--
-- Name: program_name_unique; Type: CONSTRAINT; Schema: public; Owner: indoktrinator
--

ALTER TABLE ONLY program
    ADD CONSTRAINT program_name_unique UNIQUE (name) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: program_pkey; Type: CONSTRAINT; Schema: public; Owner: indoktrinator
--

ALTER TABLE ONLY program
    ADD CONSTRAINT program_pkey PRIMARY KEY (uuid);


--
-- Name: segment_no_overlap; Type: CONSTRAINT; Schema: public; Owner: indoktrinator
--

ALTER TABLE ONLY segment
    ADD CONSTRAINT segment_no_overlap EXCLUDE USING gist (day WITH =, range WITH &&);


--
-- Name: segment_pkey; Type: CONSTRAINT; Schema: public; Owner: indoktrinator
--

ALTER TABLE ONLY segment
    ADD CONSTRAINT segment_pkey PRIMARY KEY (uuid);


--
-- Name: fki_device_program_pkey; Type: INDEX; Schema: public; Owner: indoktrinator
--

CREATE INDEX fki_device_program_pkey ON device USING btree (program);


--
-- Name: fki_event_playlist_fkey; Type: INDEX; Schema: public; Owner: indoktrinator
--

CREATE INDEX fki_event_playlist_fkey ON event USING btree (playlist);


--
-- Name: fki_event_program_fkey; Type: INDEX; Schema: public; Owner: indoktrinator
--

CREATE INDEX fki_event_program_fkey ON event USING btree (program);


--
-- Name: fki_segment_playlist_fkey; Type: INDEX; Schema: public; Owner: indoktrinator
--

CREATE INDEX fki_segment_playlist_fkey ON segment USING btree (playlist);


--
-- Name: fki_segment_program_fkey; Type: INDEX; Schema: public; Owner: indoktrinator
--

CREATE INDEX fki_segment_program_fkey ON segment USING btree (program);


--
-- Name: device_changelog; Type: TRIGGER; Schema: public; Owner: indoktrinator
--

CREATE TRIGGER device_changelog AFTER INSERT OR DELETE OR UPDATE ON device FOR EACH ROW EXECUTE PROCEDURE changelog();


--
-- Name: event_changelog; Type: TRIGGER; Schema: public; Owner: indoktrinator
--

CREATE TRIGGER event_changelog AFTER INSERT OR DELETE OR UPDATE ON event FOR EACH ROW EXECUTE PROCEDURE changelog();


--
-- Name: file_changelog; Type: TRIGGER; Schema: public; Owner: indoktrinator
--

CREATE TRIGGER file_changelog AFTER INSERT OR DELETE OR UPDATE ON file FOR EACH ROW EXECUTE PROCEDURE changelog();


--
-- Name: item_changelog; Type: TRIGGER; Schema: public; Owner: indoktrinator
--

CREATE TRIGGER item_changelog AFTER INSERT OR DELETE OR UPDATE ON item FOR EACH ROW EXECUTE PROCEDURE changelog();


--
-- Name: playlist_changelog; Type: TRIGGER; Schema: public; Owner: indoktrinator
--

CREATE TRIGGER playlist_changelog AFTER INSERT OR DELETE OR UPDATE ON playlist FOR EACH ROW EXECUTE PROCEDURE changelog();


--
-- Name: program_changelog; Type: TRIGGER; Schema: public; Owner: indoktrinator
--

CREATE TRIGGER program_changelog AFTER INSERT OR DELETE OR UPDATE ON program FOR EACH ROW EXECUTE PROCEDURE changelog();


--
-- Name: segment_changelog; Type: TRIGGER; Schema: public; Owner: indoktrinator
--

CREATE TRIGGER segment_changelog AFTER INSERT OR DELETE OR UPDATE ON segment FOR EACH ROW EXECUTE PROCEDURE changelog();


--
-- Name: update_item_durations_trigger; Type: TRIGGER; Schema: public; Owner: indoktrinator
--

CREATE TRIGGER update_item_durations_trigger AFTER INSERT OR DELETE OR UPDATE OF duration ON file FOR EACH STATEMENT EXECUTE PROCEDURE update_item_durations();


--
-- Name: update_playlist_durations_trigger; Type: TRIGGER; Schema: public; Owner: indoktrinator
--

CREATE TRIGGER update_playlist_durations_trigger AFTER INSERT OR DELETE OR UPDATE OF duration ON item FOR EACH STATEMENT EXECUTE PROCEDURE update_playlist_durations();


--
-- Name: device_photo_device_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indoktrinator
--

ALTER TABLE ONLY device_photo
    ADD CONSTRAINT device_photo_device_fkey FOREIGN KEY (id) REFERENCES device(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: device_program_pkey; Type: FK CONSTRAINT; Schema: public; Owner: indoktrinator
--

ALTER TABLE ONLY device
    ADD CONSTRAINT device_program_pkey FOREIGN KEY (program) REFERENCES program(uuid) ON UPDATE CASCADE ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;


--
-- Name: event_playlist_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indoktrinator
--

ALTER TABLE ONLY event
    ADD CONSTRAINT event_playlist_fkey FOREIGN KEY (playlist) REFERENCES playlist(uuid) ON UPDATE CASCADE ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;


--
-- Name: event_program_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indoktrinator
--

ALTER TABLE ONLY event
    ADD CONSTRAINT event_program_fkey FOREIGN KEY (program) REFERENCES program(uuid) ON UPDATE CASCADE ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;


--
-- Name: file_preview_file_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indoktrinator
--

ALTER TABLE ONLY file_preview
    ADD CONSTRAINT file_preview_file_fkey FOREIGN KEY (uuid) REFERENCES file(uuid) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: item_file_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indoktrinator
--

ALTER TABLE ONLY item
    ADD CONSTRAINT item_file_fkey FOREIGN KEY (file) REFERENCES file(uuid) ON DELETE CASCADE;


--
-- Name: item_playlist_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indoktrinator
--

ALTER TABLE ONLY item
    ADD CONSTRAINT item_playlist_fkey FOREIGN KEY (playlist) REFERENCES playlist(uuid) ON UPDATE CASCADE ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;


--
-- Name: segment_playlist_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indoktrinator
--

ALTER TABLE ONLY segment
    ADD CONSTRAINT segment_playlist_fkey FOREIGN KEY (playlist) REFERENCES playlist(uuid) ON UPDATE CASCADE ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;


--
-- Name: segment_program_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indoktrinator
--

ALTER TABLE ONLY segment
    ADD CONSTRAINT segment_program_fkey FOREIGN KEY (program) REFERENCES program(uuid) ON UPDATE CASCADE ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;


--
-- Name: public; Type: ACL; Schema: -; Owner: indoktrinator
--

REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM indoktrinator;
GRANT ALL ON SCHEMA public TO indoktrinator;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--

