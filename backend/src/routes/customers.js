const express = require('express');
const prisma = require('../prisma');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

router.get('/', authenticate, authorize(['ADMIN', 'AGENT', 'UNDERWRITER', 'CLAIMS_OFFICER']), async (_req, res) => {
  const customers = await prisma.user.findMany({
    where: { role: 'CUSTOMER' },
    include: { profile: true }
  });
  res.json(customers);
});

router.get('/me', authenticate, async (req, res) => {
  const profile = await prisma.customerProfile.findUnique({ where: { userId: req.user.id } });
  res.json(profile || { userId: req.user.id });
});

router.put('/me', authenticate, async (req, res) => {
  try {
    const { phone, address, dateOfBirth, kycDocs, dependents } = req.body;
    const profile = await prisma.customerProfile.upsert({
      where: { userId: req.user.id },
      update: {
        phone,
        address,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        kycDocs,
        dependents
      },
      create: {
        userId: req.user.id,
        phone,
        address,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        kycDocs,
        dependents
      }
    });
    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Failed to update profile' });
  }
});

module.exports = router;
