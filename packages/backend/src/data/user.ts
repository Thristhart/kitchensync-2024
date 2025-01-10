import { database } from "./database";
import { UserDBO, WriteUserDBO } from "./model";

export function doesUserExistWithEmail(email: string) {
  const statement = database
    .prepare("SELECT EXISTS(SELECT 1 FROM users WHERE email = ?)")
    .pluck();
  return statement.get(email) === 1;
}
export function doesUserExistWithId(id: number) {
  const statement = database
    .prepare("SELECT EXISTS(SELECT 1 FROM users WHERE id = ?)")
    .pluck();
  return statement.get(id) === 1;
}

export async function registerUser(email: string) {
  const statement = database.prepare<WriteUserDBO>(
    "INSERT into users (email) VALUES (@email)"
  );
  statement.run({
    email,
  });
}

export async function getUserByEmail(email: string) {
  return database
    .prepare<string>("SELECT * FROM users WHERE email=? LIMIT 1")
    .get(email) as UserDBO;
}

export async function getUserById(id: number) {
  return database
    .prepare<number>("SELECT * FROM users WHERE id=? LIMIT 1")
    .get(id) as UserDBO;
}
