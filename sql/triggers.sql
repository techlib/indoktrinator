CREATE OR REPLACE FUNCTION public.file_changed()
  RETURNS trigger AS
$BODY$
DECLARE row record;
BEGIN
	FOR row IN SELECT uuid, duration FROM item WHERE file = NEW.uuid
	LOOP
		-- CALL all records, because we want to touch trigger UPDATE on item
		UPDATE item SET duration = LEAST(NEW.duration, row.duration) WHERE uuid = row.uuid;
	END LOOP;
 RETURN NEW;
END;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;


CREATE OR REPLACE FUNCTION public.item_changed()
  RETURNS trigger AS
$BODY$
BEGIN

    UPDATE playlist SET duration = (SELECT SUM(duration) FROM item WHERE playlist = NEW.playlist);
 RETURN NEW;
END;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;

CREATE OR REPLACE FUNCTION public.playlist_changed()
  RETURNS trigger AS
$BODY$
DECLARE row record;
DECLARE ITEM record;
BEGIN
    IF TG_OP = 'DELETE'
    THEN
        ITEM := OLD;
    ELSE
        ITEM := NEW;
    END IF;

    FOR row IN SELECT uuid, program, range FROM segment WHERE playlist = ITEM.uuid
    LOOP
        if LOWER(row.range) + ITEM.duration != UPPER(row.range)
        THEN
            UPDATE segment SET range = int4range(LOWER(row.range), LOWER(row.range) + ITEM.duration) WHERE uuid = row.uuid;
            UPDATE program SET dirty = TRUE WHERE uuid = row.program;
        END IF;
    END LOOP;

    FOR row IN SELECT uuid, program, range FROM event WHERE playlist = ITEM.uuid
    LOOP
        if LOWER(row.range) + ITEM.duration != UPPER(row.range)
        THEN
            UPDATE event SET range = int4range(LOWER(row.range), LOWER(row.range) + ITEM.duration) WHERE uuid = row.uuid;
            UPDATE program SET dirty = TRUE WHERE uuid = row.program;
        END IF;
    END LOOP;

 RETURN ITEM;
END;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;

CREATE OR REPLACE FUNCTION public.program_changed()
  RETURNS trigger AS

$BODY$
BEGIN
 -- PASS all as is
 RETURN NEW;
END;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;
