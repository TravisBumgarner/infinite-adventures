import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "../db/connection.js";
import { users } from "../db/schema.js";

export interface UserRow {
  id: string;
  auth_id: string;
  email: string;
  display_name: string;
  created_at: string;
  updated_at: string;
}

export async function getUserByAuthId(authId: string): Promise<UserRow | undefined> {
  const db = getDb();
  const [row] = await db.select().from(users).where(eq(users.auth_id, authId));
  return row;
}

export async function getUserById(id: string): Promise<UserRow | undefined> {
  const db = getDb();
  const [row] = await db.select().from(users).where(eq(users.id, id));
  return row;
}

export async function getOrCreateUserByAuth(input: {
  authId: string;
  email: string;
  displayName?: string;
}): Promise<UserRow> {
  const existing = await getUserByAuthId(input.authId);
  if (existing) {
    return existing;
  }

  const db = getDb();
  const id = uuidv4();
  const displayName = input.displayName || input.email.split("@")[0];

  await db.insert(users).values({
    id,
    auth_id: input.authId,
    email: input.email,
    display_name: displayName,
  });

  return (await getUserByAuthId(input.authId)) as UserRow;
}
