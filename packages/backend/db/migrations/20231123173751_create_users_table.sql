-- migrate:up
create table users (
    id INTEGER UNIQUE NOT NULL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT
);

-- migrate:down

drop table users;