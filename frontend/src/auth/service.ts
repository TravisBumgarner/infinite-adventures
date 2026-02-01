type AuthSuccess<T = undefined> = T extends undefined
  ? { success: true }
  : { success: true; data: T };
type AuthError = { success: false; error: string };
type AuthResult<T = undefined> = AuthSuccess<T> | AuthError;

export interface AuthUser {
  id: string;
  email: string;
}

export async function getUser(): Promise<AuthResult<AuthUser>> {
  return { success: false, error: "not implemented" };
}

export async function login(_input: { email: string; password: string }): Promise<AuthResult> {
  return { success: false, error: "not implemented" };
}

export async function signup(_input: { email: string; password: string }): Promise<AuthResult> {
  return { success: false, error: "not implemented" };
}

export async function logout(): Promise<AuthResult> {
  return { success: false, error: "not implemented" };
}

export async function getToken(): Promise<AuthResult<string>> {
  return { success: false, error: "not implemented" };
}

export async function resetPassword(_email: string, _redirectUrl?: string): Promise<AuthResult> {
  return { success: false, error: "not implemented" };
}

export async function updatePassword(_password: string): Promise<AuthResult> {
  return { success: false, error: "not implemented" };
}
