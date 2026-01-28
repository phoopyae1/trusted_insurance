const express = require('express');
const multer = require('multer');
const prisma = require('../prisma');
const { authenticate, authorize } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const { NotFoundError, ValidationError } = require('../utils/errors');
const { validateRequired, validateNumber } = require('../utils/validation');
const { validateClaim } = require('../services/claimValidationService');
const { logAudit } = require('../services/auditLogService');
const { recordAtenxionTransaction } = require('../services/atenxionTransactionService');
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

router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const claim = await prisma.claim.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      policy: {
        include: {
          product: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      assessedByUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
  if (!claim) throw new NotFoundError('Claim');
  if (!STAFF_ROLES.includes(req.user.role) && claim.userId !== req.user.id) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  res.json({ success: true, data: claim });
}));

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
      include: {
        policy: {
          include: {
            product: true,
          },
        },
      },
    });

    await logAudit({
      actorId: req.user.id,
      action: 'CLAIM_SUBMITTED',
      entityType: 'Claim',
      entityId: claim.id,
      metadata: { amount: claim.amount },
    });

    // Record Atenxion transaction when claim is submitted
    recordAtenxionTransaction(claim.userId, 'CLAIM_SUBMITTED').catch(err => {
      console.error('Failed to record Atenxion transaction for claim submission:', err);
    });

    res.status(201).json({ success: true, data: claim });
  })
);

// Start assessment - move claim to IN_REVIEW
router.patch(
  '/:id/assess',
  authenticate,
  authorize(['CLAIMS_OFFICER', 'ADMIN']),
  asyncHandler(async (req, res) => {
    const claim = await prisma.claim.findUnique({ where: { id: Number(req.params.id) } });
    if (!claim) throw new NotFoundError('Claim');

    const updatedClaim = await prisma.claim.update({
      where: { id: Number(req.params.id) },
      data: { status: 'IN_REVIEW' },
      include: {
        policy: {
          include: {
            product: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    await logAudit({
      actorId: req.user.id,
      action: 'CLAIM_IN_REVIEW',
      entityType: 'Claim',
      entityId: claim.id,
      metadata: {},
    });

    res.json({ success: true, data: updatedClaim });
  })
);

// Make claim decision (Approve, Partially Approve, or Reject)
router.patch(
  '/:id/decision',
  authenticate,
  authorize(['CLAIMS_OFFICER', 'ADMIN']),
  asyncHandler(async (req, res) => {
    validateRequired(req.body, ['status', 'decisionReason']);
    const { status, eligibleAmount, deductible, approvedAmount, decisionReason } = req.body;

    if (!['APPROVED', 'PARTIALLY_APPROVED', 'REJECTED'].includes(status)) {
      throw new ValidationError('Invalid status. Must be APPROVED, PARTIALLY_APPROVED, or REJECTED');
    }

    const claim = await prisma.claim.findUnique({
      where: { id: Number(req.params.id) },
      include: { policy: { include: { product: true } } },
    });
    if (!claim) throw new NotFoundError('Claim');

    const updateData = {
      status,
      decisionReason,
      assessedAt: new Date(),
      assessedBy: req.user.id,
    };

    if (status === 'APPROVED' || status === 'PARTIALLY_APPROVED') {
      if (eligibleAmount !== undefined) updateData.eligibleAmount = validateNumber(eligibleAmount, 'Eligible Amount');
      if (deductible !== undefined) updateData.deductible = validateNumber(deductible, 'Deductible');
      if (approvedAmount !== undefined) {
        updateData.approvedAmount = validateNumber(approvedAmount, 'Approved Amount');
      } else if (eligibleAmount !== undefined && deductible !== undefined) {
        updateData.approvedAmount = eligibleAmount - deductible;
      }
    }

    const updatedClaim = await prisma.claim.update({
      where: { id: Number(req.params.id) },
      data: updateData,
      include: {
        policy: {
          include: {
            product: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assessedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    await logAudit({
      actorId: req.user.id,
      action: `CLAIM_${status}`,
      entityType: 'Claim',
      entityId: claim.id,
      metadata: {
        status,
        approvedAmount: updatedClaim.approvedAmount,
        eligibleAmount: updatedClaim.eligibleAmount,
        deductible: updatedClaim.deductible,
      },
    });

    // Record Atenxion transaction when claim is approved or partially approved
    if (status === 'APPROVED' || status === 'PARTIALLY_APPROVED') {
      recordAtenxionTransaction(claim.userId, 'CLAIM_APPROVED').catch(err => {
        console.error('Failed to record Atenxion transaction for claim approval:', err);
      });
    }

    res.json({ success: true, data: updatedClaim });
  })
);

// Process payment for approved claim
router.patch(
  '/:id/pay',
  authenticate,
  authorize(['CLAIMS_OFFICER', 'ADMIN']),
  asyncHandler(async (req, res) => {
    const claim = await prisma.claim.findUnique({ where: { id: Number(req.params.id) } });
    if (!claim) throw new NotFoundError('Claim');

    if (claim.status !== 'APPROVED' && claim.status !== 'PARTIALLY_APPROVED') {
      throw new ValidationError('Only approved or partially approved claims can be paid');
    }

    const updatedClaim = await prisma.claim.update({
      where: { id: Number(req.params.id) },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
      include: {
        policy: {
          include: {
            product: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    await logAudit({
      actorId: req.user.id,
      action: 'CLAIM_PAID',
      entityType: 'Claim',
      entityId: claim.id,
      metadata: { approvedAmount: claim.approvedAmount },
    });

    res.json({ success: true, data: updatedClaim });
  })
);

// Legacy status update endpoint (kept for backward compatibility)
router.patch('/:id/status', authenticate, authorize(['CLAIMS_OFFICER', 'ADMIN']), asyncHandler(async (req, res) => {
    const { status } = req.body;
    const claim = await prisma.claim.update({ where: { id: Number(req.params.id) }, data: { status } });

    await logAudit({
      actorId: req.user.id,
      action: `CLAIM_${status}`,
      entityType: 'Claim',
      entityId: claim.id,
      metadata: { status }
    });

  res.json({ success: true, data: claim });
}));

module.exports = router;
