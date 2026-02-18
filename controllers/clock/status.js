const supabase = require('../../lib/supabase');
const { authenticate, cors } = require('../../lib/auth');

module.exports = async function handler(req, res) {
    if (cors(req, res)) return;
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const auth = authenticate(req);
    if (!auth) return res.status(401).json({ error: 'Unauthorized' });

    try {
        // Get active clock-in
        const { data: active } = await supabase
            .from('time_entries')
            .select('*')
            .eq('user_id', auth.id)
            .is('clock_out', null)
            .single();

        // Get today's entries
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const { data: todayEntries } = await supabase
            .from('time_entries')
            .select('*')
            .eq('user_id', auth.id)
            .gte('clock_in', todayStart.toISOString())
            .order('clock_in', { ascending: false });

        // Get user info + company
        const { data: user } = await supabase
            .from('users')
            .select('*, companies(id, name, code, hourly_rate)')
            .eq('id', auth.id)
            .single();

        return res.status(200).json({
            active: active ? { id: active.id, clockIn: active.clock_in } : null,
            todayEntries: (todayEntries || []).map(e => ({
                id: e.id,
                clockIn: e.clock_in,
                clockOut: e.clock_out
            })),
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                companyId: user.company_id
            },
            company: user.companies ? {
                id: user.companies.id,
                name: user.companies.name,
                code: user.companies.code,
                hourlyRate: Number(user.companies.hourly_rate)
            } : null
        });
    } catch (err) {
        console.error('Clock status error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
};
