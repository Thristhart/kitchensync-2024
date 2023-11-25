-- migrate:up
create table public_key_credentials (
    external_id TEXT,
    public_key TEXT,
    counter INTEGER,
    user_id INTEGER,
    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON UPDATE CASCADE
)

-- migrate:down

drop table public_key_credentials