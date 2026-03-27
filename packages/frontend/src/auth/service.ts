import { supabase } from "../lib/supabase.js";

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
  if (!supabase) return { success: false, error: "Supabase not configured" };

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return { success: false, error: error?.message ?? "Not authenticated" };
  }
  return { success: true, data: { id: data.user.id, email: data.user.email ?? "" } };
}

export async function login(input: { email: string; password: string }): Promise<AuthResult> {
  if (!supabase) return { success: false, error: "Supabase not configured" };

  const { error } = await supabase.auth.signInWithPassword(input);
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function signup(input: { email: string; password: string }): Promise<AuthResult> {
  if (!supabase) return { success: false, error: "Supabase not configured" };

  const { error } = await supabase.auth.signUp(input);
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function logout(): Promise<AuthResult> {
  if (!supabase) return { success: false, error: "Supabase not configured" };

  const { error } = await supabase.auth.signOut();
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function getToken(): Promise<AuthResult<string>> {
  if (!supabase) return { success: false, error: "Supabase not configured" };

  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    return { success: false, error: "No active session" };
  }
  return { success: true, data: data.session.access_token };
}

export async function resetPassword(email: string, redirectUrl?: string): Promise<AuthResult> {
  if (!supabase) return { success: false, error: "Supabase not configured" };

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,
  });
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function updatePassword(password: string): Promise<AuthResult> {
  if (!supabase) return { success: false, error: "Supabase not configured" };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}
