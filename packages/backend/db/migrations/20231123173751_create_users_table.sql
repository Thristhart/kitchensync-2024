-- migrate:up
create table users (
    id INTEGER UNIQUE NOT NULL PRIMARY KEY,
    name TEXT
);

-- migrate:down

drop table users;