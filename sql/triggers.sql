CREATE OR REPLACE FUNCTION public.file_changed()
  RETURNS trigger AS
$BODY$
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
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;


CREATE OR REPLACE FUNCTION public.item_changed()
  RETURNS trigger AS
$BODY$
BEGIN
    IF TG_OP = 'DELETE'
    THEN
        RETURN NEW;
    ELSE
        UPDATE playlist SET duration = (SELECT SUM(duration) FROM item WHERE playlist = NEW.playlist);
    END IF;
 RETURN NEW;
END;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;
