const bcrypt = require('bcryptjs');
const supabase = require('../../lib/supabase');
const { signToken, cors } = require('../../lib/auth');

module.exports = async function handler(req, res) {
    if (cors(req, res)) return;
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Check if user already exists
        const { data: existing } = await supabase
            .from('users')
            .select('id')
            .eq('email', email.toLowerCase())
            .single();

        if (existing) {
            return res.status(409).json({ error: 'Account already exists. Please sign in.' });
        }

        const password_hash = await bcrypt.hash(password, 10);

        const { data: user, error } = await supabase
            .from('users')
            .insert({ name, email: email.toLowerCase(), password_hash })
            .select()
            .single();

        if (error) throw error;

        const token = signToken(user);

        return res.status(201).json({
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role, companyId: user.company_id, status: user.status }
        });
    } catch (err) {
        console.error('Signup error:', err);
        return res.status(500).json({
            error: 'Server error',
            debug: err.message || String(err),
            supabaseUrl: process.env.SUPABASE_URL || 'USING_HARDCODED',
            hasServiceKey: !!process.env.SUPABASE_SERVICE_KEY
        });
    }
};
