import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "../connection.js";
import { users } from "../schema.js";

export interface UserRow {
  id: string;
  auth_id: string;
  email: string;
  display_name: string;
  created_at: string;
  updated_at: string;
}

export function getUserByAuthId(authId: string): UserRow | undefined {
  const db = getDb();
  return db.select().from(users).where(eq(users.auth_id, authId)).get();
}

export function getUserById(id: string): UserRow | undefined {
  const db = getDb();
  return db.select().from(users).where(eq(users.id, id)).get();
}

export function getOrCreateUserByAuth(input: {
  authId: string;
  email: string;
  displayName?: string;
}): UserRow {
  const existing = getUserByAuthId(input.authId);
  if (existing) {
    return existing;
  }

  const db = getDb();
  const id = uuidv4();
  const displayName = input.displayName || input.email.split("@")[0];

  db.insert(users)
    .values({
      id,
      auth_id: input.authId,
      email: input.email,
      display_name: displayName,
    })
    .run();

  return getUserByAuthId(input.authId) as UserRow;
}
