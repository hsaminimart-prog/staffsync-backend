const supabase = require('../../lib/supabase');
const { authenticate, cors } = require('../../lib/auth');

module.exports = async function handler(req, res) {
    if (cors(req, res)) return;
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const auth = authenticate(req);
    if (!auth) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const now = new Date();

        // Start of day
        const dayStart = new Date(now);
        dayStart.setHours(0, 0, 0, 0);

        // Start of week (Monday)
        const weekStart = new Date(now);
        const day = weekStart.getDay();
        const diff = day === 0 ? 6 : day - 1;
        weekStart.setDate(weekStart.getDate() - diff);
        weekStart.setHours(0, 0, 0, 0);

        // Start of month
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        // Get all entries for this month (covers all periods)
        const { data: entries } = await supabase
            .from('time_entries')
            .select('*')
            .eq('user_id', auth.id)
            .not('clock_out', 'is', null)
            .gte('clock_in', monthStart.toISOString())
            .order('clock_in', { ascending: false });

        const allEntries = entries || [];

        function calcMs(list, start) {
            return list
                .filter(e => new Date(e.clock_in) >= start)
                .reduce((sum, e) => sum + (new Date(e.clock_out) - new Date(e.clock_in)), 0);
        }

        const todayMs = calcMs(allEntries, dayStart);
        const weekMs = calcMs(allEntries, weekStart);
        const monthMs = calcMs(allEntries, monthStart);

        // Get company for rate
        const { data: user } = await supabase
            .from('users')
            .select('company_id, companies(hourly_rate)')
            .eq('id', auth.id)
            .single();

        const rate = user?.companies ? Number(user.companies.hourly_rate) : 0;

        // Recent history (last 20 completed entries)
        const { data: history } = await supabase
            .from('time_entries')
            .select('*')
            .eq('user_id', auth.id)
            .not('clock_out', 'is', null)
            .order('clock_in', { ascending: false })
            .limit(20);

        return res.status(200).json({
            today: { ms: todayMs, earnings: (todayMs / 3600000) * rate },
            week: { ms: weekMs, earnings: (weekMs / 3600000) * rate },
            month: { ms: monthMs, earnings: (monthMs / 3600000) * rate },
            hourlyRate: rate,
            history: (history || []).map(e => ({
                id: e.id,
                clockIn: e.clock_in,
                clockOut: e.clock_out
            }))
        });
    } catch (err) {
        console.error('Hours error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
};
