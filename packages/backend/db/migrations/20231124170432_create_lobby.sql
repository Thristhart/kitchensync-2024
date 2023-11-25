-- migrate:up
create table lobbies (
    id TEXT UNIQUE NOT NULL PRIMARY KEY,
    display_name TEXT
);

create table media_objects (
    id INTEGER UNIQUE NOT NULL PRIMARY KEY,
    faucet_data TEXT NOT NULL,
    title TEXT,
    image_url TEXT,
    duration_ms INTEGER,

    lobby_id INTEGER,
    FOREIGN KEY (lobby_id)
        REFERENCES lobbies(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

create table lobby_users (
    flags INTEGER,

    lobby_id INTEGER,
    user_id INTEGER,
    FOREIGN KEY (lobby_id)
        REFERENCES lobbies(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

-- migrate:down

drop table lobbies;
drop table media_objects;
drop table lobby_users;