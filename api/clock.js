const clockIn = require('../controllers/clock/in');
const clockOut = require('../controllers/clock/out');
const status = require('../controllers/clock/status');
const { cors } = require('../lib/auth');

module.exports = async function handler(req, res) {
    if (cors(req, res)) return;

    const { action } = req.query;

    if (action === 'in') {
        return clockIn(req, res);
    } else if (action === 'out') {
        return clockOut(req, res);
    } else if (action === 'status') {
        return status(req, res);
    } else {
        return res.status(404).json({ error: 'Clock endpoint not found' });
    }
};
