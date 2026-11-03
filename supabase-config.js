
const SUPABASE_URL = "https://mffxlvmfrmlqhmidnmxt.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_2L5gpNpFMMqzB1x7BuuUUg_MBHT6Iny";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_PUBLISHABLE_KEY = SUPABASE_PUBLISHABLE_KEY;
window.supabaseClient = supabaseClient;