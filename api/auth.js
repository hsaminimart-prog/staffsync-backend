const signup = require('../controllers/auth/signup');
const login = require('../controllers/auth/login');
const { cors } = require('../lib/auth');

module.exports = async function handler(req, res) {
    if (cors(req, res)) return;

    const { action } = req.query;

    if (action === 'signup') {
        return signup(req, res);
    } else if (action === 'login') {
        return login(req, res);
    } else {
        return res.status(404).json({ error: 'Auth endpoint not found' });
    }
};
