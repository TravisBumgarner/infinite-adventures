import { createClient } from "@supabase/supabase-js";
import config from "../config.js";

export const supabase =
  config.supabaseUrl && config.supabaseServiceRoleKey
    ? createClient(config.supabaseUrl, config.supabaseServiceRoleKey)
    : null;
