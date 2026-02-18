const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'staffsync-dev-secret-change-me';

function signToken(user) {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role, companyId: user.company_id },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}

function verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
}

function authenticate(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    try {
        return verifyToken(authHeader.slice(7));
    } catch {
        return null;
    }
}

// Standard CORS preflight handler + JSON helpers
function cors(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return true;
    }
    return false;
}

module.exports = { signToken, verifyToken, authenticate, cors };
