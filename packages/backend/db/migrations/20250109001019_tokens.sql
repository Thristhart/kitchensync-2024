-- migrate:up
create table tokens (
    refresh_token_id TEXT UNIQUE NOT NULL PRIMARY KEY,
    refresh_token_secret_hash TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    timestamp INTEGER NOT NULL,
    session_ua TEXT NOT NULL,
    session_ip TEXT NOT NULL
);

-- migrate:down

drop table tokens;