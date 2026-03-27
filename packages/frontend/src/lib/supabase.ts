import { createClient } from "@supabase/supabase-js";
import config from "../config.js";

export const supabase =
  config.supabaseUrl && config.supabaseAnonKey
    ? createClient(config.supabaseUrl, config.supabaseAnonKey)
    : null;
