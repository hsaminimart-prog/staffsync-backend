const bcrypt = require('bcryptjs');
const supabase = require('../../lib/supabase');
const { signToken, cors } = require('../../lib/auth');

module.exports = async function handler(req, res) {
    if (cors(req, res)) return;
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email.toLowerCase())
            .single();

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Get company info if exists
        let company = null;
        if (user.company_id) {
            const { data } = await supabase
                .from('companies')
                .select('*')
                .eq('id', user.company_id)
                .single();
            company = data;
        }

        // Get join request status if staff
        let joinRequest = null;
        if (user.role === 'staff') {
            const { data } = await supabase
                .from('join_requests')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
            joinRequest = data;
        }

        const token = signToken(user);

        return res.status(200).json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                companyId: user.company_id,
                status: user.status
            },
            company: company ? { id: company.id, name: company.name, code: company.code, hourlyRate: Number(company.hourly_rate) } : null,
            joinRequest: joinRequest ? { id: joinRequest.id, status: joinRequest.status } : null
        });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
};
