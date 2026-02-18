const hours = require('../controllers/staff/hours');
const list = require('../controllers/staff/list');
const { cors } = require('../lib/auth');

module.exports = async function handler(req, res) {
    if (cors(req, res)) return;

    const { action } = req.query;

    if (action === 'hours') {
        return hours(req, res);
    } else if (action === 'list') {
        return list(req, res);
    } else {
        return res.status(404).json({ error: 'Staff endpoint not found' });
    }
};
