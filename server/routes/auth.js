const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../config/db');
const { authenticateToken, requireRoles, JWT_SECRET } = require('../middleware/auth');
const { validateCreateUser, validateUpdateUser } = require('../middleware/validation');

const router = express.Router();

const publicUser = user => ({
  id: user.id,
  username: user.username,
  full_name: user.full_name,
  role: user.role
});

const createToken = (user, sessionId) => jwt.sign(
  { id: user.id, username: user.username, full_name: user.full_name, role: user.role, session_id: sessionId },
  JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
);

const logSystemEvent = async (eventType, username, req, details = null) => {
  try {
    let publicIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
    if (typeof publicIp === 'string' && publicIp.includes('.')) publicIp = publicIp.split(':')[0];
    await prisma.systemEventLog.create({
      data: {
        event_type: eventType,
        username: username,
        public_ip: publicIp,
        details: details
      }
    });
  } catch (err) {
    console.error('Error logging system event:', err);
  }
};

// Login
router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, error: 'Username and password are required' });

    const user = await prisma.appUser.findUnique({
      where: { username: username.trim() }
    });
    if (!user) {
      let publicIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
    if (typeof publicIp === 'string' && publicIp.includes('.')) publicIp = publicIp.split(':')[0];
      await prisma.failedLoginAttempt.create({
        data: {
          username: username.trim(),
          public_ip: publicIp
        }
      });
      return res.status(401).json({ success: false, error: 'Invalid username or password' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      let publicIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
    if (typeof publicIp === 'string' && publicIp.includes('.')) publicIp = publicIp.split(':')[0];
      await prisma.failedLoginAttempt.create({
        data: {
          username: username.trim(),
          public_ip: publicIp
        }
      });
      return res.status(401).json({ success: false, error: 'Invalid username or password' });
    }

    const sessionId = crypto.randomUUID();
    let publicIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
    if (typeof publicIp === 'string' && publicIp.includes('.')) publicIp = publicIp.split(':')[0];

    await prisma.appSession.create({
      data: {
        session_id: sessionId,
        user_id: user.id,
        public_ip: publicIp,
        status: 'active'
      }
    });

    await logSystemEvent('LOGIN_SUCCESS', user.username, req, `User successfully logged in: ${user.full_name} (${user.role})`);

    const token = createToken(user, sessionId);

    res.json({ success: true, token, user: { ...publicUser(user), session_id: sessionId } });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ success: false, error: 'An unexpected error occurred' });
  }
});

// Create User (Restricted to Super Admin & Admin)
router.post('/auth/create-user', authenticateToken, requireRoles(['super_admin', 'admin', 'manager']), validateCreateUser, async (req, res) => {
  try {
    const { username, password, fullName, role } = req.body;
    const normalizedUsername = username.trim();
    const normalizedFullName = fullName.trim();
    const normalizedRole = role.trim();

    const allowedRoles = req.user.role === 'super_admin'
      ? ['super_admin', 'manager', 'engineer', 'technician', 'inspector']
      : req.user.role === 'admin' || req.user.role === 'manager'
      ? ['manager', 'engineer', 'technician', 'inspector']
      : ['engineer', 'technician', 'inspector'];

    if (!allowedRoles.includes(normalizedRole)) {
      return res.status(403).json({ success: false, error: 'You are not allowed to assign that role' });
    }

    const existingUser = await prisma.appUser.findUnique({
      where: { username: normalizedUsername },
      select: { id: true }
    });
    if (existingUser) {
      return res.status(409).json({ success: false, error: 'Username is already taken' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.appUser.create({
      data: {
        username: normalizedUsername,
        password_hash: passwordHash,
        full_name: normalizedFullName,
        role: normalizedRole
      },
      select: {
        id: true,
        username: true,
        full_name: true,
        role: true
      }
    });

    await logSystemEvent('USER_CREATE', req.user.username, req, `Created user: ${user.username} (${user.role}) - ${user.full_name}`);

    res.status(201).json({ success: true, user: publicUser(user) });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, error: 'An unexpected error occurred' });
  }
});

// Current User Details
router.get('/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.appUser.findUnique({
      where: { id: req.user.id },
      select: { id: true, username: true, full_name: true, role: true }
    });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, user: { ...user, session_id: req.user.session_id } });
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ success: false, error: 'An unexpected error occurred' });
  }
});

// Get list of potential assignees (Available to all logged-in users)
router.get('/auth/active-assignees', authenticateToken, async (req, res) => {
  try {
    const users = await prisma.appUser.findMany({
      where: {
        role: {
          in: ['technician', 'engineer', 'manager', 'super_admin', 'admin']
        }
      },
      select: {
        username: true,
        full_name: true,
        role: true
      },
      orderBy: { full_name: 'asc' }
    });
    res.json({ success: true, users });
  } catch (error) {
    console.error('Error fetching assignees:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch assignees' });
  }
});

// Get all users (Restricted to Super Admin & Admin)
router.get('/auth/users', authenticateToken, requireRoles(['super_admin', 'admin', 'manager']), async (req, res) => {
  try {
    const users = await prisma.appUser.findMany({
      orderBy: { id: 'asc' },
      include: {
        sessions: {
          orderBy: { login_time: 'desc' },
          take: 1
        }
      }
    });

    const formattedUsers = users.map(u => {
      const latestSession = u.sessions[0] || null;
      return {
        id: u.id,
        username: u.username,
        full_name: u.full_name,
        role: u.role,
        last_login: latestSession ? latestSession.login_time : null,
        session_status: latestSession ? latestSession.status : null,
        last_ip: latestSession ? latestSession.public_ip : null
      };
    });

    res.json({ success: true, users: formattedUsers });
  } catch (error) {
    console.error('Error listing users:', error);
    res.status(500).json({ success: false, error: 'An unexpected error occurred' });
  }
});

// Update User
router.put('/auth/users/:id', authenticateToken, validateUpdateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, fullName, role, password } = req.body;

    const targetId = parseInt(id);
    if (isNaN(targetId)) {
      return res.status(400).json({ success: false, error: 'Invalid user ID' });
    }

    const targetUser = await prisma.appUser.findUnique({
      where: { id: targetId },
      select: { role: true, username: true }
    });
    if (!targetUser) return res.status(404).json({ success: false, error: 'User not found' });

    // Allow user to edit themselves ONLY if they are NOT changing role/username (unless super_admin)
    // Actually, let's look at the permissions:
    // 1. Users can edit their own profile (name, password) but cannot change role.
    // 2. super_admin can edit anyone.
    // 3. admin can edit inspectors/technicians.
    const isSelfEdit = req.user.id === targetId;
    const canEdit = isSelfEdit ||
                    (req.user.role === 'super_admin') || 
                    (req.user.role === 'admin' && targetUser.role !== 'super_admin') ||
                    (req.user.role === 'manager' && ['manager', 'engineer', 'technician', 'inspector'].includes(targetUser.role));

    if (!canEdit) {
      return res.status(403).json({ success: false, error: 'You do not have permission to edit this user' });
    }

    const dataToUpdate = {};
    
    // Self-edits can't change username or role unless they are super_admin
    if (username) {
      if (isSelfEdit && req.user.role !== 'super_admin' && username.trim() !== targetUser.username) {
        return res.status(403).json({ success: false, error: 'You cannot change your own username' });
      }
      dataToUpdate.username = username.trim();
    }

    if (fullName) dataToUpdate.full_name = fullName.trim();
    
    if (role) {
      if (isSelfEdit && role !== targetUser.role) {
        return res.status(403).json({ success: false, error: 'You cannot change your own role' });
      }
      const allowedRoles = req.user.role === 'super_admin'
        ? ['super_admin', 'manager', 'engineer', 'technician', 'inspector']
        : req.user.role === 'admin' || req.user.role === 'manager'
      ? ['manager', 'engineer', 'technician', 'inspector']
        : ['engineer', 'technician', 'inspector'];
      if (!allowedRoles.includes(role)) {
        return res.status(403).json({ success: false, error: 'You are not allowed to assign that role' });
      }
      dataToUpdate.role = role;
    }

    if (password) {
      dataToUpdate.password_hash = await bcrypt.hash(password, 10);
    }

    if (username && username.trim() !== targetUser.username) {
      const existingUser = await prisma.appUser.findUnique({
        where: { username: username.trim() }
      });
      if (existingUser && existingUser.id !== targetId) {
        return res.status(409).json({ success: false, error: 'Username is already taken' });
      }
    }

    await prisma.appUser.update({
      where: { id: targetId },
      data: dataToUpdate
    });

    await logSystemEvent('USER_UPDATE', req.user.username, req, `Updated user details for: ${targetUser.username} (changed fields: ${Object.keys(dataToUpdate).join(', ')})`);

    res.json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, error: 'An unexpected error occurred' });
  }
});

// Delete User
router.delete('/auth/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const targetId = parseInt(id);
    if (isNaN(targetId)) {
      return res.status(400).json({ success: false, error: 'Invalid user ID' });
    }

    if (targetId === req.user.id) {
      return res.status(400).json({ success: false, error: 'You cannot delete your own account' });
    }

    const targetUser = await prisma.appUser.findUnique({
      where: { id: targetId },
      select: { role: true, username: true }
    });
    if (!targetUser) return res.status(404).json({ success: false, error: 'User not found' });

    // Guard: cannot delete the last remaining super_admin
    if (targetUser.role === 'super_admin') {
      const superAdminCount = await prisma.appUser.count({ where: { role: 'super_admin' } });
      if (superAdminCount <= 1) {
        return res.status(400).json({ success: false, error: 'Cannot delete the only Super Admin account.' });
      }
    }

    const canDelete = (req.user.role === 'super_admin') || 
                      (req.user.role === 'admin' && targetUser.role !== 'super_admin') ||
                      (req.user.role === 'manager' && ['manager', 'engineer', 'technician', 'inspector'].includes(targetUser.role));

    if (!canDelete) {
      return res.status(403).json({ success: false, error: 'You do not have permission to delete this user' });
    }

    await prisma.appUser.delete({
      where: { id: targetId }
    });

    await logSystemEvent('USER_DELETE', req.user.username, req, `Deleted user account: ${targetUser.username} (ID ${targetId})`);

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, error: 'An unexpected error occurred' });
  }
});

// Logout
router.post('/auth/logout', authenticateToken, async (req, res) => {
  try {
    const sessionId = req.user?.session_id;
    if (sessionId) {
      await prisma.appSession.update({
        where: { session_id: sessionId },
        data: {
          status: 'logged_out',
          logout_time: new Date()
        }
      });
      await logSystemEvent('LOGOUT', req.user.username, req, `User logged out: ${req.user.full_name}`);
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).json({ success: false, error: 'An unexpected error occurred' });
  }
});

// Get own sessions
router.get('/auth/sessions/me', authenticateToken, async (req, res) => {
  try {
    const sessions = await prisma.appSession.findMany({
      where: { user_id: req.user.id },
      orderBy: { login_time: 'desc' }
    });
    res.json({ success: true, sessions });
  } catch (error) {
    console.error('Error listing sessions:', error);
    res.status(500).json({ success: false, error: 'An unexpected error occurred' });
  }
});

// Get all sessions summary (Super Admin only)
router.get('/auth/sessions/all', authenticateToken, requireRoles(['super_admin']), async (req, res) => {
  try {
    const users = await prisma.appUser.findMany({
      orderBy: { id: 'asc' },
      include: {
        sessions: {
          orderBy: { login_time: 'desc' }
        }
      }
    });

    const formattedUsers = users.map(u => {
      const activeSessions = u.sessions.filter(s => s.status === 'active');
      const latestSession = u.sessions[0] || null;
      return {
        id: u.id,
        username: u.username,
        full_name: u.full_name,
        role: u.role,
        last_login: latestSession ? latestSession.login_time : null,
        last_ip: latestSession ? latestSession.public_ip : null,
        active_sessions_count: activeSessions.length,
        active_sessions: activeSessions.map(s => ({
          session_id: s.session_id,
          login_time: s.login_time,
          public_ip: s.public_ip
        }))
      };
    });

    res.json({ success: true, users: formattedUsers });
  } catch (error) {
    console.error('Error listing all sessions:', error);
    res.status(500).json({ success: false, error: 'An unexpected error occurred' });
  }
});

// Revoke session
router.post('/auth/sessions/:sessionId/revoke', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await prisma.appSession.findUnique({
      where: { session_id: sessionId }
    });

    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    if (session.user_id !== req.user.id && req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, error: 'Permission denied: Cannot revoke another user\'s session' });
    }

    await prisma.appSession.update({
      where: { session_id: sessionId },
      data: {
        status: 'logged_out',
        logout_time: new Date()
      }
    });

    res.json({ success: true, message: 'Session revoked successfully' });
  } catch (error) {
    console.error('Error revoking session:', error);
    res.status(500).json({ success: false, error: 'An unexpected error occurred' });
  }
});

// Change Password (Self Service)
router.post('/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Current password and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'New password must be at least 6 characters long' });
    }

    const user = await prisma.appUser.findUnique({
      where: { id: req.user.id }
    });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const passwordMatches = await bcrypt.compare(currentPassword, user.password_hash);
    if (!passwordMatches) return res.status(400).json({ success: false, error: 'Incorrect current password' });

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await prisma.appUser.update({
      where: { id: req.user.id },
      data: { password_hash: newPasswordHash }
    });

    await logSystemEvent('PASSWORD_CHANGE', user.username, req, `User changed their password: ${user.full_name}`);

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ success: false, error: 'An unexpected error occurred' });
  }
});

// Get Failed Login Attempts (filtered for lower roles)
router.get('/auth/failed-logins', authenticateToken, async (req, res) => {
  try {
    const filterOpts = {};
    if (['engineer', 'technician', 'inspector'].includes(req.user.role)) {
      filterOpts.where = { username: req.user.username };
    }
    const attempts = await prisma.failedLoginAttempt.findMany({
      ...filterOpts,
      orderBy: { created_at: 'desc' }
    });
    res.json({ success: true, data: attempts });
  } catch (error) {
    console.error('Error fetching failed logins:', error);
    res.status(500).json({ success: false, error: 'An unexpected error occurred' });
  }
});

// Get System Event Logs (filtered for lower roles)
router.get('/auth/system-events', authenticateToken, async (req, res) => {
  try {
    const filterOpts = {};
    if (['engineer', 'technician', 'inspector'].includes(req.user.role)) {
      filterOpts.where = { username: req.user.username };
    }
    const logs = await prisma.systemEventLog.findMany({
      ...filterOpts,
      orderBy: { created_at: 'desc' }
    });
    res.json({ success: true, data: logs });
  } catch (error) {
    console.error('Error fetching system events:', error);
    res.status(500).json({ success: false, error: 'An unexpected error occurred' });
  }
});

module.exports = router;

