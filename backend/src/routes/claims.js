const express = require('express');
const multer = require('multer');
const prisma = require('../prisma');
const { authenticate, authorize } = require('../middleware/auth');
const { validateClaim } = require('../services/claimValidationService');
const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  const where = ['ADMIN', 'STAFF'].includes(req.user.role) ? {} : { userId: req.user.id };
  const claims = await prisma.claim.findMany({ where, include: { policy: true } });
  res.json(claims);
});

router.get('/:id', authenticate, async (req, res) => {
  const claim = await prisma.claim.findUnique({ where: { id: Number(req.params.id) }, include: { policy: true } });
  if (!claim) return res.status(404).json({ message: 'Claim not found' });
  if (!['ADMIN', 'STAFF'].includes(req.user.role) && claim.userId !== req.user.id) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  res.json(claim);
});

router.post('/', authenticate, authorize(['CUSTOMER', 'ADMIN', 'STAFF']), upload.array('attachments'), async (req, res) => {
  try {
    const { policyId, claimType, amount, incidentDate, description } = req.body;
    const policy = await prisma.policy.findUnique({ where: { id: Number(policyId) }, include: { product: true } });
    if (!policy) return res.status(404).json({ message: 'Policy not found' });

    const errors = validateClaim(policy, policy.product, { claimType, amount: Number(amount), incidentDate, description });
    if (errors.length) return res.status(400).json({ message: 'Validation failed', errors });

    const attachments = (req.files || []).map((file) => ({ filename: file.originalname, mimetype: file.mimetype }));
    const claim = await prisma.claim.create({
      data: {
        policyId: policy.id,
        userId: req.user.id,
        claimType,
        amount: Number(amount),
        incidentDate: new Date(incidentDate),
        description,
        attachments
      }
    });
    res.status(201).json(claim);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Failed to submit claim' });
  }
});

router.patch('/:id/status', authenticate, authorize(['STAFF', 'ADMIN']), async (req, res) => {
  try {
    const { status } = req.body;
    const claim = await prisma.claim.update({ where: { id: Number(req.params.id) }, data: { status } });
    res.json(claim);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Failed to update claim status' });
  }
});

module.exports = router;
