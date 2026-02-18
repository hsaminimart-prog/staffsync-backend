const supabase = require('../../lib/supabase');
const { authenticate, cors } = require('../../lib/auth');

module.exports = async function handler(req, res) {
    if (cors(req, res)) return;
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const auth = authenticate(req);
    if (!auth) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const { name, hourlyRate } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Company name is required' });
        }

        // Generate unique company code
        const prefix = name.replace(/[^A-Z]/gi, '').slice(0, 4).toUpperCase() || 'COMP';
        const code = prefix + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();

        const { data: company, error: compError } = await supabase
            .from('companies')
            .insert({
                name,
                code,
                owner_id: auth.id,
                hourly_rate: hourlyRate || 0
            })
            .select()
            .single();

        if (compError) throw compError;

        // Update user to owner
        const { error: userError } = await supabase
            .from('users')
            .update({ role: 'owner', company_id: company.id, status: 'APPROVED' })
            .eq('id', auth.id);

        if (userError) throw userError;

        return res.status(201).json({
            company: {
                id: company.id,
                name: company.name,
                code: company.code,
                hourlyRate: Number(company.hourly_rate)
            }
        });
    } catch (err) {
        console.error('Create company error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
};
