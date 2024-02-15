CREATE TABLE subscribers (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    telegram_id text,
    added_at date
);

CREATE TABLE xcode_versions (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    build text,
    added_at date
);
