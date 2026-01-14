const express = require('express');
const prisma = require('../prisma');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

router.get('/', authenticate, authorize(['ADMIN']), async (_req, res) => {
  const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, include: { actor: true } });
  res.json(logs);
});

module.exports = router;
