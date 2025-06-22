import jwt from 'jsonwebtoken';

const JWT_SECRET = 'warehouse_management_secret_key_2024';

// Authentication middleware
export const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next(); // Ensure next() is called on successful authentication
  } catch (error) {
    console.error('JWT verification error:', error.message);
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

// Admin middleware
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  next();
};