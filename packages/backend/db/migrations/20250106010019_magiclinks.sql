-- migrate:up
create table magic_links (
    id TEXT UNIQUE NOT NULL PRIMARY KEY,
    email TEXT NOT NULL,
    secret_hash TEXT UNIQUE NOT NULL,
    timestamp INTEGER NOT NULL,
    validated INTEGER,
    session_secret_hash TEXT NOT NULL,
    session_ua TEXT NOT NULL,
    session_ip TEXT NOT NULL
);

-- migrate:down

drop table magic_links;