import { randomBytes } from "crypto";
import { database } from "./database";
import {
  WriteMagicLinkDBO,
  MagicLinkDBO,
  TokenDBO,
  WriteTokenDBO,
  PublicKeyCredentialDBO,
  WritePublicKeyCredentialDBO,
  WriteWebauthnChallengeDBO,
  WebauthnChallengeDBO,
} from "./model";
import * as argon2 from "argon2";
import jwt from "jsonwebtoken";
import { doesUserExistWithEmail, doesUserExistWithId } from "./user";

const minute = 60 * 1000;
const hour = 60 * minute;
const day = 24 * hour;

const magicLinkExpiry = 15 * minute;
export const refreshTokenExpiry = 30 * day;
const webAuthnChallengeExpiry = 5 * minute;

const signingSecret = process.env.SIGNING_SECRET;
if (!signingSecret) {
  throw "Missing SIGNING_SECRET env variable";
}

// a real database would have a regular task that does this or something like that
// but we'll just run this whenever we create or query magic links
export function deleteExpiredMagicLinks() {
  const statement = database.prepare<{ expiration: number }>(
    "DELETE FROM magic_links WHERE timestamp <= @expiration"
  );
  statement.run({
    expiration: Date.now() - magicLinkExpiry,
  });
}

export function deleteExpiredTokens() {
  const statement = database.prepare<{ expiration: number }>(
    "DELETE FROM tokens WHERE timestamp <= @expiration"
  );
  statement.run({
    expiration: Date.now() - refreshTokenExpiry,
  });
}

function deleteExpiredWebauthnChallenges() {
  const statement = database.prepare<{ expiration: number }>(
    "DELETE FROM webauthn_challenges WHERE timestamp <= @expiration"
  );
  statement.run({
    expiration: Date.now() - webAuthnChallengeExpiry,
  });
}

export async function createMagicLink(
  email: string,
  session_ip: string,
  session_ua: string
) {
  deleteExpiredMagicLinks();
  const id = randomBytes(32).toString("base64url");
  const secret = randomBytes(32).toString("base64url");
  const session_secret = randomBytes(32).toString("base64url");
  const statement = database.prepare<WriteMagicLinkDBO>(
    "INSERT INTO magic_links (id, email, secret_hash, timestamp, session_secret_hash, session_ua, session_ip) VALUES (@id, @email, @secret_hash, @timestamp, @session_secret_hash, @session_ua, @session_ip)"
  );
  const [secret_hash, session_secret_hash] = await Promise.all([
    argon2.hash(secret),
    argon2.hash(session_secret),
  ]);
  const result = statement.run({
    id,
    email,
    secret_hash,
    session_secret_hash,
    session_ip,
    session_ua,
    timestamp: Date.now(),
  });
  return { link: `/api/link/${id}/${secret}`, session_secret, id };
}

export async function validateMagicLink(id: string, secret: string) {
  deleteExpiredMagicLinks();

  const statement = database.prepare<string>(
    "SELECT email, secret_hash FROM magic_links WHERE id=? LIMIT 1"
  );
  const record = statement.get(id) as MagicLinkDBO;
  if (!record) {
    return false;
  }
  if (await argon2.verify(record.secret_hash, secret)) {
    database
      .prepare<Partial<WriteMagicLinkDBO>>(
        "UPDATE magic_links SET timestamp=@timestamp, validated=@validated WHERE id=@id"
      )
      .run({ id, timestamp: Date.now(), validated: 1 });
    return true;
  }
  return false;
}

export async function consumeMagicLink(id: string, session_secret: string) {
  deleteExpiredMagicLinks();
  const statement = database.prepare<string>(
    "SELECT email, session_secret_hash FROM magic_links WHERE id=? AND validated=1 LIMIT 1"
  );
  const record = statement.get(id) as
    | Pick<MagicLinkDBO, "email" | "session_secret_hash">
    | undefined;
  if (!record) {
    return false;
  }
  if (await argon2.verify(record.session_secret_hash, session_secret)) {
    database.prepare<string>("DELETE FROM magic_links WHERE id=?").run(id);
    return record.email;
  }
  return false;
}

export async function consumeRefreshToken(
  refresh_token: string,
  session_ip: string,
  session_ua: string
) {
  deleteExpiredTokens();

  const [refresh_token_id, refresh_token_secret] = refresh_token.split(".");

  const statement = database.prepare<string>(
    "SELECT user_id, refresh_token_secret_hash FROM tokens WHERE refresh_token_id=? LIMIT 1"
  );
  const record = statement.get(refresh_token_id) as
    | Pick<TokenDBO, "user_id" | "refresh_token_secret_hash">
    | undefined;
  if (!record) {
    return false;
  }
  if (
    !(await argon2.verify(
      record.refresh_token_secret_hash,
      refresh_token_secret
    ))
  ) {
    return false;
  }
  database
    .prepare<string>("DELETE FROM tokens WHERE refresh_token_id=?")
    .run(refresh_token_id);
  return createTokensForUser(record.user_id, session_ip, session_ua);
}

export async function createTokensForUser(
  id: number,
  session_ip: string,
  session_ua: string
) {
  deleteExpiredTokens();

  if (!doesUserExistWithId(id)) {
    throw new Error("Trying to create token for id that doesn't exist");
  }

  const access_token = await new Promise((resolve, reject) => {
    jwt.sign(
      { sub: id },
      signingSecret!,
      { expiresIn: "30m" },
      (err, encoded) => {
        if (err || !encoded) {
          return reject(err);
        }
        return resolve(encoded);
      }
    );
  });

  const refresh_token_id = randomBytes(32).toString("base64url");
  const refresh_token_secret = randomBytes(32).toString("base64url");
  const statement = database.prepare<WriteTokenDBO>(
    "INSERT INTO tokens (user_id, refresh_token_id, refresh_token_secret_hash, timestamp, session_ua, session_ip) VALUES (@user_id, @refresh_token_id, @refresh_token_secret_hash, @timestamp, @session_ua, @session_ip)"
  );
  const refresh_token_secret_hash = await argon2.hash(refresh_token_secret);
  const result = statement.run({
    user_id: id,
    refresh_token_id,
    refresh_token_secret_hash,
    session_ip,
    session_ua,
    timestamp: Date.now(),
  });
  return {
    access_token,
    refresh_token: `${refresh_token_id}.${refresh_token_secret}`,
  };
}

export async function validateAccessToken(access_token: string) {
  try {
    const claims = await new Promise<jwt.JwtPayload>((resolve, reject) => {
      jwt.verify(access_token, signingSecret!, (err, claims) => {
        if (err || !claims) {
          return reject(err);
        }
        resolve(claims as jwt.JwtPayload);
      });
    });
    return claims;
  } catch (e) {
    return false;
  }
}

export async function saveWebauthnChallenge(
  challenge_id: string,
  challenge: string
) {
  deleteExpiredWebauthnChallenges();
  const statement = database.prepare<WriteWebauthnChallengeDBO>(
    "INSERT INTO webauthn_challenges (challenge_id, challenge, timestamp) VALUES (@challenge_id, @challenge, @timestamp)"
  );
  statement.run({
    challenge_id,
    challenge,
    timestamp: Date.now(),
  });
}

export async function getWebauthnChallenge(
  challenge_id: string
): Promise<string | undefined> {
  deleteExpiredWebauthnChallenges();
  const statement = database.prepare<string>(
    "SELECT * from webauthn_challenges where challenge_id=? LIMIT 1"
  );
  const registration = statement.get(challenge_id) as WebauthnChallengeDBO;
  if (registration.challenge) {
    // consume the challenge
    database
      .prepare<string>("DELETE from webauthn_challenges where challenge_id=?")
      .run(challenge_id);
  }
  return registration?.challenge;
}
export async function associatePublicKeyWithUser(
  user_id: number,
  counter: number,
  public_key: string,
  external_id: string
) {
  database
    .prepare<WritePublicKeyCredentialDBO>(
      "INSERT INTO public_key_credentials (user_id, counter, public_key, external_id) VALUES (@user_id, @counter, @public_key, @external_id)"
    )
    .run({ user_id, counter, public_key, external_id });
}

export async function getPublicKeyById(external_id: string) {
  const statement = database.prepare<string>(
    "SELECT * from public_key_credentials where external_id=? LIMIT 1"
  );
  const registration = statement.get(external_id) as
    | PublicKeyCredentialDBO
    | undefined;
  return registration;
}

export async function updateCounter(external_id: string, counter: number) {
  database
    .prepare<Partial<WritePublicKeyCredentialDBO>>(
      "UPDATE public_key_credentials SET counter=@counter WHERE external_id=@external_id"
    )
    .run({ external_id, counter });
}
