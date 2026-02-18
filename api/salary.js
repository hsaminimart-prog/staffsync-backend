const report = require('../controllers/salary/report');
const { cors } = require('../lib/auth');

module.exports = async function handler(req, res) {
    if (cors(req, res)) return;

    const { action } = req.query;

    if (action === 'report') {
        return report(req, res);
    } else {
        return res.status(404).json({ error: 'Salary endpoint not found' });
    }
};
