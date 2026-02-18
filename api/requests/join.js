const supabase = require('../../lib/supabase');
const { authenticate, cors } = require('../../lib/auth');

module.exports = async function handler(req, res) {
    if (cors(req, res)) return;
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const auth = authenticate(req);
    if (!auth) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ error: 'Company code is required' });
        }

        // Find company by code
        const { data: company } = await supabase
            .from('companies')
            .select('*')
            .eq('code', code.toUpperCase())
            .single();

        if (!company) {
            return res.status(404).json({ error: 'Company not found. Check the code.' });
        }

        // Check if already requested
        const { data: existing } = await supabase
            .from('join_requests')
            .select('id')
            .eq('user_id', auth.id)
            .single();

        if (existing) {
            return res.status(409).json({ error: 'You already have a join request.' });
        }

        // Create join request
        const { error: reqError } = await supabase
            .from('join_requests')
            .insert({
                user_id: auth.id,
                company_id: company.id,
                status: 'PENDING'
            });

        if (reqError) throw reqError;

        // Update user
        const { error: userError } = await supabase
            .from('users')
            .update({ role: 'staff', company_id: company.id, status: 'PENDING' })
            .eq('id', auth.id);

        if (userError) throw userError;

        return res.status(201).json({ message: 'Join request sent', companyName: company.name });
    } catch (err) {
        console.error('Join request error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
};
