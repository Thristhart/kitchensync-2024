-- migrate:up
create table public_key_credentials (
    public_key TEXT NOT NULL,
    counter INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON UPDATE CASCADE
)

-- migrate:down

drop table public_key_credentials;