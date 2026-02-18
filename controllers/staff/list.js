const supabase = require('../../lib/supabase');
const { authenticate, cors } = require('../../lib/auth');

module.exports = async function handler(req, res) {
    if (cors(req, res)) return;
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const auth = authenticate(req);
    if (!auth) return res.status(401).json({ error: 'Unauthorized' });

    try {
        // Verify owner
        const { data: user } = await supabase
            .from('users')
            .select('role, company_id')
            .eq('id', auth.id)
            .single();

        if (!user || user.role !== 'owner') {
            return res.status(403).json({ error: 'Only owners can view staff list' });
        }

        // Get approved staff
        const { data: requests } = await supabase
            .from('join_requests')
            .select('user_id, users(id, name, email)')
            .eq('company_id', user.company_id)
            .eq('status', 'APPROVED');

        // Check who is currently clocked in
        const staffList = [];
        for (const r of (requests || [])) {
            if (!r.users) continue;
            const { data: active } = await supabase
                .from('time_entries')
                .select('id')
                .eq('user_id', r.users.id)
                .is('clock_out', null)
                .single();

            staffList.push({
                id: r.users.id,
                name: r.users.name,
                email: r.users.email,
                clockedIn: !!active
            });
        }

        return res.status(200).json({ staff: staffList });
    } catch (err) {
        console.error('Staff list error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
};
