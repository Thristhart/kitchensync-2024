-- migrate:up
create table webauthn_challenges (
    challenge_id TEXT NOT NULL,
    challenge TEXT NOT NULL,
    timestamp INTEGER NOT NULL
);

-- migrate:down

drop table webauthn_challenges;