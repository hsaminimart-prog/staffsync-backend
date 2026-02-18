const join = require('../controllers/requests/join');
const list = require('../controllers/requests/list');
const respond = require('../controllers/requests/respond');
const status = require('../controllers/requests/status');
const { cors } = require('../lib/auth');

module.exports = async function handler(req, res) {
    if (cors(req, res)) return;

    const { action } = req.query;

    if (action === 'join') {
        return join(req, res);
    } else if (action === 'list') {
        return list(req, res);
    } else if (action === 'respond') {
        return respond(req, res);
    } else if (action === 'status') {
        return status(req, res);
    } else {
        return res.status(404).json({ error: 'Requests endpoint not found' });
    }
};
