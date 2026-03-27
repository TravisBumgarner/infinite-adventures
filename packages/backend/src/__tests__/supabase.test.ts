import { describe, expect, it } from "vitest";
import { supabase } from "../lib/supabase.js";

describe("supabase client", () => {
  it("exports a SupabaseClient when env vars are set", () => {
    expect(supabase).not.toBeNull();
  });
});
