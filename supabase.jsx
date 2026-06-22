// Configuração do cliente Supabase
const SUPABASE_URL = 'https://svgvtmkqjvxsoduohfuy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2Z3Z0bWtxanZ4c29kdW9oZnV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxMDAxNjIsImV4cCI6MjA5NzY3NjE2Mn0.7JqR_lY5Hs_XdDE2Wo6GxkMHT2T_udOSqRlqL4_MyrI';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Exponha globalmente
window.supabaseClient = supabaseClient;
window.supabase_db = supabaseClient;
