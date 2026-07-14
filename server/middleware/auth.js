const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'aoi-checkpoint-local-secret';

if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'aoi-checkpoint-local-secret')) {
  console.warn('⚠️ SECURITY WARNING: JWT_SECRET is not set or using default fallback in production mode!');
}

async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!token) return res.status(401).json({ success: false, error: 'Authentication required' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if the session is still active in the database
    if (decoded.session_id) {
      const dbSession = await prisma.appSession.findUnique({
        where: { session_id: decoded.session_id }
      });
      
      if (!dbSession || dbSession.status !== 'active') {
        return res.status(401).json({ success: false, error: 'Session has been revoked or logged out.' });
      }
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Session expired. Please sign in again.' });
  }
}

function requireRoles(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Access denied: Insufficient permissions' });
    }
    next();
  };
}

module.exports = { authenticateToken, requireRoles, JWT_SECRET };
