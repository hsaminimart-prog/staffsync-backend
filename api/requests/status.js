const supabase = require('../../lib/supabase');
const { authenticate, cors } = require('../../lib/auth');

module.exports = async function handler(req, res) {
    if (cors(req, res)) return;
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const auth = authenticate(req);
    if (!auth) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const { data: request } = await supabase
            .from('join_requests')
            .select('id, status')
            .eq('user_id', auth.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (!request) {
            return res.status(404).json({ error: 'No join request found' });
        }

        return res.status(200).json({ status: request.status });
    } catch (err) {
        console.error('Check status error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
};
