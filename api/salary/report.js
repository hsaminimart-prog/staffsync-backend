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
            return res.status(403).json({ error: 'Only owners can view salary reports' });
        }

        const { data: company } = await supabase
            .from('companies')
            .select('hourly_rate')
            .eq('id', user.company_id)
            .single();

        const rate = company ? Number(company.hourly_rate) : 0;

        // Get period from query
        const period = req.query.period || 'weekly';
        const now = new Date();
        let periodStart;

        if (period === 'daily') {
            periodStart = new Date(now);
            periodStart.setHours(0, 0, 0, 0);
        } else if (period === 'weekly') {
            periodStart = new Date(now);
            const day = periodStart.getDay();
            const diff = day === 0 ? 6 : day - 1;
            periodStart.setDate(periodStart.getDate() - diff);
            periodStart.setHours(0, 0, 0, 0);
        } else {
            periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        // Get approved staff
        const { data: requests } = await supabase
            .from('join_requests')
            .select('user_id, users(id, name, email)')
            .eq('company_id', user.company_id)
            .eq('status', 'APPROVED');

        const report = [];
        let totalEarnings = 0;

        for (const r of (requests || [])) {
            if (!r.users) continue;

            const { data: entries } = await supabase
                .from('time_entries')
                .select('clock_in, clock_out')
                .eq('user_id', r.users.id)
                .not('clock_out', 'is', null)
                .gte('clock_in', periodStart.toISOString());

            const ms = (entries || []).reduce((sum, e) =>
                sum + (new Date(e.clock_out) - new Date(e.clock_in)), 0);

            const hours = ms / 3600000;
            const earnings = hours * rate;
            totalEarnings += earnings;

            report.push({
                id: r.users.id,
                name: r.users.name,
                email: r.users.email,
                hoursMs: ms,
                earnings
            });
        }

        return res.status(200).json({
            report,
            totalEarnings,
            hourlyRate: rate,
            period
        });
    } catch (err) {
        console.error('Salary report error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
};
