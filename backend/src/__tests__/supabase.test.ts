import { describe, expect, it } from "vitest";
import { supabase } from "../lib/supabase.js";

describe("supabase client", () => {
  it("exports null when env vars are empty", () => {
    expect(supabase).toBeNull();
  });
});
