import jwt from 'jsonwebtoken';

// Middleware to verify token
const verifyToken = (req, res, next) => {
    const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';
    const token = req.headers['authorization']?.split(' ')[1]; // Get token from header

    if (!token) {
        return res.status(403).json({ error: 'Token is required' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        req.user = decoded; // Store user info in req.user
        next();
    });
};

export default verifyToken;
