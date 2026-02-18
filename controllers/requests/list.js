const supabase = require('../../lib/supabase');
const { authenticate, cors } = require('../../lib/auth');

module.exports = async function handler(req, res) {
    if (cors(req, res)) return;
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const auth = authenticate(req);
    if (!auth) return res.status(401).json({ error: 'Unauthorized' });

    try {
        // Verify user is owner
        const { data: user } = await supabase
            .from('users')
            .select('role, company_id')
            .eq('id', auth.id)
            .single();

        if (!user || user.role !== 'owner') {
            return res.status(403).json({ error: 'Only owners can view requests' });
        }

        // Get pending requests with user info
        const { data: requests, error } = await supabase
            .from('join_requests')
            .select('id, status, created_at, user_id, users(id, name, email)')
            .eq('company_id', user.company_id)
            .eq('status', 'PENDING')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const formatted = (requests || []).map(r => ({
            id: r.id,
            status: r.status,
            createdAt: r.created_at,
            user: r.users ? { id: r.users.id, name: r.users.name, email: r.users.email } : null
        }));

        return res.status(200).json({ requests: formatted });
    } catch (err) {
        console.error('List requests error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
};
