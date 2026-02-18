const supabase = require('../../lib/supabase');
const { authenticate, cors } = require('../../lib/auth');

module.exports = async function handler(req, res) {
    if (cors(req, res)) return;
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const auth = authenticate(req);
    if (!auth) return res.status(401).json({ error: 'Unauthorized' });

    try {
        // Get user
        const { data: user } = await supabase
            .from('users')
            .select('role, company_id, status')
            .eq('id', auth.id)
            .single();

        if (!user || user.status !== 'APPROVED') {
            return res.status(403).json({ error: 'Not approved' });
        }

        // Check if already clocked in
        const { data: active } = await supabase
            .from('time_entries')
            .select('id')
            .eq('user_id', auth.id)
            .is('clock_out', null)
            .single();

        if (active) {
            return res.status(409).json({ error: 'Already clocked in. Clock out first.' });
        }

        const { data: entry, error } = await supabase
            .from('time_entries')
            .insert({
                user_id: auth.id,
                company_id: user.company_id,
                clock_in: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        return res.status(201).json({
            entry: { id: entry.id, clockIn: entry.clock_in, clockOut: null }
        });
    } catch (err) {
        console.error('Clock in error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
};
