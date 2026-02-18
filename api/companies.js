const create = require('../controllers/companies/create');
const settings = require('../controllers/companies/settings');
const { cors } = require('../lib/auth');

module.exports = async function handler(req, res) {
    if (cors(req, res)) return;

    const { action } = req.query;

    if (action === 'create') {
        return create(req, res);
    } else if (action === 'settings') {
        return settings(req, res);
    } else {
        return res.status(404).json({ error: 'Company endpoint not found' });
    }
};
