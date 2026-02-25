const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dkroffwlvegsrkjowljb.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrcm9mZndsdmVnc3Jram93bGpiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTE3MDk5NCwiZXhwIjoyMDg2NzQ2OTk0fQ.07kDlhA6gX5GW7wWPxSV4V3dZBT65AoMK3f1QUQ7v8M';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

module.exports = supabase;
