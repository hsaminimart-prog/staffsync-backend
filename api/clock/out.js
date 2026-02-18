const supabase = require('../../lib/supabase');
const { authenticate, cors } = require('../../lib/auth');

module.exports = async function handler(req, res) {
    if (cors(req, res)) return;
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const auth = authenticate(req);
    if (!auth) return res.status(401).json({ error: 'Unauthorized' });

    try {
        // Find active clock-in
        const { data: active } = await supabase
            .from('time_entries')
            .select('*')
            .eq('user_id', auth.id)
            .is('clock_out', null)
            .single();

        if (!active) {
            return res.status(404).json({ error: 'No active clock-in found' });
        }

        const clockOut = new Date().toISOString();

        const { error } = await supabase
            .from('time_entries')
            .update({ clock_out: clockOut })
            .eq('id', active.id);

        if (error) throw error;

        return res.status(200).json({
            entry: { id: active.id, clockIn: active.clock_in, clockOut }
        });
    } catch (err) {
        console.error('Clock out error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
};
