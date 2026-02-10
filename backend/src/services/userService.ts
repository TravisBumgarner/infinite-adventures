import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "../db/connection.js";
import { users } from "../db/schema.js";

export interface UserRow {
  id: string;
  authId: string;
  email: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
}

export async function getUserByAuthId(authId: string): Promise<UserRow | undefined> {
  const db = getDb();
  const [row] = await db.select().from(users).where(eq(users.authId, authId));
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
    authId: input.authId,
    email: input.email,
    displayName: displayName,
  });

  return (await getUserByAuthId(input.authId)) as UserRow;
}
