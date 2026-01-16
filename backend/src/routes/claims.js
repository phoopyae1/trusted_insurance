const express = require('express');
const multer = require('multer');
const prisma = require('../prisma');
const { authenticate, authorize } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const { NotFoundError, ValidationError } = require('../utils/errors');
const { validateRequired, validateNumber } = require('../utils/validation');
const { validateClaim } = require('../services/claimValidationService');
const { logAudit } = require('../services/auditLogService');
const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

const STAFF_ROLES = ['ADMIN', 'AGENT', 'UNDERWRITER', 'CLAIMS_OFFICER'];

router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const where = STAFF_ROLES.includes(req.user.role) ? {} : { userId: req.user.id };
    const claims = await prisma.claim.findMany({
      where,
      include: { policy: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: claims, count: claims.length });
  })
);

router.get('/:id', authenticate, async (req, res) => {
  const claim = await prisma.claim.findUnique({ where: { id: Number(req.params.id) }, include: { policy: true } });
  if (!claim) return res.status(404).json({ message: 'Claim not found' });
  if (!STAFF_ROLES.includes(req.user.role) && claim.userId !== req.user.id) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  res.json(claim);
});

router.post(
  '/',
  authenticate,
  authorize(['CUSTOMER', 'ADMIN', 'AGENT']),
  upload.array('attachments'),
  asyncHandler(async (req, res) => {
    validateRequired(req.body, ['policyId', 'claimType', 'amount', 'incidentDate', 'description']);
    const { policyId, claimType, amount, incidentDate, description } = req.body;
    
    const policy = await prisma.policy.findUnique({
      where: { id: validateNumber(policyId, 'Policy ID') },
      include: { product: true },
    });
    if (!policy) throw new NotFoundError('Policy');

    const errors = validateClaim(policy, policy.product, {
      claimType,
      amount: validateNumber(amount, 'Amount'),
      incidentDate,
      description,
    });
    if (errors.length) {
      throw new ValidationError('Claim validation failed', errors);
    }

    const attachments = (req.files || []).map((file) => ({
      filename: file.originalname,
      mimetype: file.mimetype,
    }));

    const claim = await prisma.claim.create({
      data: {
        policyId: policy.id,
        userId: req.user.id,
        claimType,
        amount: Number(amount),
        incidentDate: new Date(incidentDate),
        description,
        attachments,
      },
    });

    await logAudit({
      actorId: req.user.id,
      action: 'CLAIM_SUBMITTED',
      entityType: 'Claim',
      entityId: claim.id,
      metadata: { amount: claim.amount },
    });

    res.status(201).json({ success: true, data: claim });
  })
);

router.patch('/:id/status', authenticate, authorize(['CLAIMS_OFFICER', 'ADMIN']), async (req, res) => {
  try {
    const { status } = req.body;
    const claim = await prisma.claim.update({ where: { id: Number(req.params.id) }, data: { status } });

    await logAudit({
      actorId: req.user.id,
      action: `CLAIM_${status}`,
      entityType: 'Claim',
      entityId: claim.id,
      metadata: { status }
    });

    res.json(claim);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Failed to update claim status' });
  }
});

module.exports = router;
