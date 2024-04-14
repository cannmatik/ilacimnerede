import { createClient } from "@supabase/supabase-js";
import React from "react";

export const supabase = createClient(
  import.meta.env.IlacimNerede_SUPABASE_URL,
  import.meta.env.IlacimNerede_SUPABASE_KEY
);
