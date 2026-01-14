const express = require('express');
const bcrypt = require('bcrypt');
const prisma = require('../prisma');
const { authenticate, authorize } = require('../middleware/auth');
const { logAudit } = require('../services/auditLogService');
const router = express.Router();

const STAFF_ROLES = ['ADMIN', 'AGENT', 'UNDERWRITER', 'CLAIMS_OFFICER'];

router.get('/', authenticate, authorize(['ADMIN']), async (_req, res) => {
  const users = await prisma.user.findMany({ select: { id: true, email: true, name: true, role: true, createdAt: true } });
  res.json(users);
});

router.post('/', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    if (!email || !password || !name || !role) return res.status(400).json({ message: 'Missing fields' });
    if (!STAFF_ROLES.includes(role)) return res.status(400).json({ message: 'Role must be a staff role' });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, password: hashed, name, role } });

    await logAudit({
      actorId: req.user.id,
      action: 'USER_CREATED',
      entityType: 'User',
      entityId: user.id,
      metadata: { role: user.role, email: user.email }
    });

    res.status(201).json({ id: user.id, email: user.email, name: user.name, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create user' });
  }
});

module.exports = router;
