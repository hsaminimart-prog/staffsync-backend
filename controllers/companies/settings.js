const supabase = require('../../lib/supabase');
const { authenticate, cors } = require('../../lib/auth');

module.exports = async function handler(req, res) {
    if (cors(req, res)) return;
    if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });

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
            return res.status(403).json({ error: 'Only company owners can update settings' });
        }

        const { name, hourlyRate } = req.body;
        const updates = {};
        if (name !== undefined) updates.name = name;
        if (hourlyRate !== undefined) updates.hourly_rate = hourlyRate;

        const { error } = await supabase
            .from('companies')
            .update(updates)
            .eq('id', user.company_id);

        if (error) throw error;

        return res.status(200).json({ message: 'Settings saved' });
    } catch (err) {
        console.error('Settings error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
};
