const SUPABASE_URL = "https://pqeeednyzgpkaoqwhyox.supabase.co";

const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_MjygvEhPoVGNoX0KRkYMLA_lfdSCLNR";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);