const { createClient } = require('@supabase/supabase-js');

// Your Supabase credentials
// When deploying to Vercel, move these to environment variables for security
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dkroffwlvegsrkjowljb.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrcm9mZndsdmVnc3Jram93bGpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNzA5OTQsImV4cCI6MjA4Njc0Njk5NH0.WZb7YYhPOpx5lQGaPi7zyMhOvB0GZ3cqZ1cH9VD9O-Y';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

module.exports = supabase;
