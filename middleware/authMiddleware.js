const jwt = require('jsonwebtoken');

const protect = (roles = []) => {
    return (req, res, next) => {
        const token = req.headers['authorization']?.split(' ')[1];
        if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

        try {
            const decoded = jwt.verify(token, 'your_jwt_secret');
            req.user = decoded;

            if (roles.length && !roles.includes(req.user.role)) {
                return res.status(403).json({ msg: 'Access denied' });
            }

            next();
        } catch (error) {
            res.status(401).json({ msg: 'Token is not valid' });
        }
    };
};

module.exports = protect;
