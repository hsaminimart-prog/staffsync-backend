const supabase = require('../../lib/supabase');
const { authenticate, cors } = require('../../lib/auth');

module.exports = async function handler(req, res) {
    if (cors(req, res)) return;
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const auth = authenticate(req);
    if (!auth) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const { requestId, action } = req.body; // action: 'approve' or 'reject'

        if (!requestId || !['approve', 'reject'].includes(action)) {
            return res.status(400).json({ error: 'requestId and action (approve/reject) required' });
        }

        // Verify user is owner
        const { data: user } = await supabase
            .from('users')
            .select('role, company_id')
            .eq('id', auth.id)
            .single();

        if (!user || user.role !== 'owner') {
            return res.status(403).json({ error: 'Only owners can respond to requests' });
        }

        // Get the request
        const { data: request } = await supabase
            .from('join_requests')
            .select('*')
            .eq('id', requestId)
            .eq('company_id', user.company_id)
            .single();

        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';

        // Update request
        const { error: reqError } = await supabase
            .from('join_requests')
            .update({ status: newStatus })
            .eq('id', requestId);

        if (reqError) throw reqError;

        // Update user status
        const { error: userError } = await supabase
            .from('users')
            .update({ status: newStatus })
            .eq('id', request.user_id);

        if (userError) throw userError;

        return res.status(200).json({ message: `Request ${newStatus.toLowerCase()}` });
    } catch (err) {
        console.error('Respond error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
};
