export interface UserRow {
  id: string;
  auth_id: string;
  email: string;
  display_name: string;
  created_at: string;
  updated_at: string;
}

export function getUserByAuthId(_authId: string): UserRow | undefined {
  return undefined;
}

export function getUserById(_id: string): UserRow | undefined {
  return undefined;
}

export function getOrCreateUserByAuth(_input: {
  authId: string;
  email: string;
  displayName?: string;
}): UserRow {
  throw new Error("not implemented");
}
