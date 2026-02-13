const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../prisma');
const { logAudit } = require('../services/auditLogService');
const { logoutAtenxionUser } = require('../services/atenxionTransactionService');
const router = express.Router();

const ACCESS_TOKEN_TTL = '1d';
const REFRESH_TOKEN_DAYS = 14;
const PASSWORD_RESET_MINUTES = 30;

function createAccessToken(user) {
  return jwt.sign({ id: user.id, role: user.role, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL
  });
}

async function createRefreshToken(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({ data: { userId, token, expiresAt } });
  return token;
}

router.post('/register', async (req, res) => {
  try {
    const { email, password, name, dateOfBirth } = req.body;
    if (!email || !password || !name) return res.status(400).json({ message: 'Missing fields' });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    // Validate dateOfBirth if provided
    let parsedDateOfBirth = null;
    if (dateOfBirth) {
      parsedDateOfBirth = new Date(dateOfBirth);
      if (isNaN(parsedDateOfBirth.getTime())) {
        return res.status(400).json({ message: 'Invalid date of birth format' });
      }
      // Ensure date is not in the future
      if (parsedDateOfBirth > new Date()) {
        return res.status(400).json({ message: 'Date of birth cannot be in the future' });
      }
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { 
        email, 
        password: hashed, 
        name, 
        role: 'CUSTOMER', 
        profile: { 
          create: dateOfBirth ? { dateOfBirth: parsedDateOfBirth } : {} 
        } 
      }
    });
    const token = createAccessToken(user);
    const refreshToken = await createRefreshToken(user.id);
    await logAudit({
      actorId: user.id,
      action: 'USER_REGISTERED',
      entityType: 'User',
      entityId: user.id,
      metadata: { email: user.email }
    });
    return res.status(201).json({
      token,
      refreshToken,
      user: { id: user.id, email: user.email, role: user.role, name: user.name }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    const token = createAccessToken(user);
    const refreshToken = await createRefreshToken(user.id);
    await logAudit({
      actorId: user.id,
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: user.id,
      metadata: { email: user.email }
    });
    return res.json({ token, refreshToken, user: { id: user.id, email: user.email, role: user.role, name: user.name } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Login failed' });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ 
        success: false,
        error: {
          message: 'Missing refresh token',
          code: 'MISSING_REFRESH_TOKEN'
        }
      });
    }

    const stored = await prisma.refreshToken.findUnique({ 
      where: { token: refreshToken }, 
      include: { user: true } 
    });
    
    if (!stored || stored.revokedAt) {
      return res.status(401).json({ 
        success: false,
        error: {
          message: 'Invalid or revoked refresh token',
          code: 'INVALID_REFRESH_TOKEN'
        }
      });
    }
    
    if (stored.expiresAt < new Date()) {
      return res.status(401).json({ 
        success: false,
        error: {
          message: 'Refresh token has expired. Please log in again.',
          code: 'REFRESH_TOKEN_EXPIRED'
        }
      });
    }

    // Revoke the old refresh token
    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() }
    });

    // Create new tokens
    const newRefreshToken = await createRefreshToken(stored.userId);
    const token = createAccessToken(stored.user);
    
    return res.json({ 
      success: true,
      token, 
      refreshToken: newRefreshToken 
    });
  } catch (err) {
    console.error('Token refresh error:', err);
    return res.status(500).json({ 
      success: false,
      error: {
        message: 'Token refresh failed',
        code: 'REFRESH_FAILED'
      }
    });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(200).json({ message: 'If the user exists, a reset token was issued.' });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_MINUTES * 60 * 1000);
    await prisma.passwordReset.create({ data: { userId: user.id, token, expiresAt } });

    return res.json({ message: 'Reset token generated', resetToken: token, expiresAt });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Password reset failed' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ message: 'Token and new password required' });

    const reset = await prisma.passwordReset.findUnique({ where: { token }, include: { user: true } });
    if (!reset || reset.usedAt) return res.status(400).json({ message: 'Invalid reset token' });
    if (reset.expiresAt < new Date()) return res.status(400).json({ message: 'Reset token expired' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: reset.userId }, data: { password: hashed } });
    await prisma.passwordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } });

    return res.json({ message: 'Password updated' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Password reset failed' });
  }
});

router.post('/logout', async (req, res) => {
  try {
    const { refreshToken, userId: bodyUserId } = req.body;
    let userId = null;
    let userEmail = null;

    // Try to authenticate user if token is provided (optional for logout)
    try {
      const header = req.headers.authorization;
      if (header) {
        const parts = header.split(' ');
        if (parts.length === 2 && parts[0] === 'Bearer' && parts[1]) {
          const decoded = jwt.verify(parts[1], process.env.JWT_SECRET);
          userId = decoded.id;
          userEmail = decoded.email;
        }
      }
    } catch (err) {
      // Token is invalid or expired - that's okay for logout
      // We'll still process the logout without Atenxion call
    }

    // Use userId from body if provided and no authenticated user
    if (!userId && bodyUserId) {
      userId = bodyUserId;
    }

    // Revoke refresh token if provided
    if (refreshToken) {
      await prisma.refreshToken.updateMany({ where: { token: refreshToken }, data: { revokedAt: new Date() } });
    }

    // Logout from Atenxion if user ID is available
    if (userId) {
      logoutAtenxionUser(userId).catch(err => {
        console.error('Failed to logout from Atenxion:', err);
        // Don't fail the logout if Atenxion logout fails
      });

      // Log audit event if we have authenticated user info
      if (userEmail) {
        await logAudit({
          actorId: userId,
          action: 'USER_LOGOUT',
          entityType: 'User',
          entityId: userId,
          metadata: { email: userEmail }
        }).catch(err => {
          console.error('Failed to log audit event:', err);
        });
      }
    }

    return res.json({ message: 'Logged out' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Logout failed' });
  }
});

module.exports = router;
