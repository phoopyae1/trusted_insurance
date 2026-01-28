const express = require('express');
const prisma = require('../prisma');
const { authenticate, authorize } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const { logAudit } = require('../services/auditLogService');
const { recordAtenxionTransaction } = require('../services/atenxionTransactionService');
const { NotFoundError, ValidationError } = require('../utils/errors');
const { validateRequired } = require('../utils/validation');
const router = express.Router();

const STAFF_ROLES = ['ADMIN', 'AGENT', 'UNDERWRITER', 'CLAIMS_OFFICER'];

router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
  const where = STAFF_ROLES.includes(req.user.role) ? {} : { userId: req.user.id };
    const policies = await prisma.policy.findMany({
      where,
      include: { product: true, quote: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({
      success: true,
      data: policies,
      count: policies.length,
    });
  })
);

router.post(
  '/',
  authenticate,
  authorize(['UNDERWRITER', 'ADMIN']),
  asyncHandler(async (req, res) => {
    const { quoteId, startDate, endDate, premiumPaid } = req.body;
    validateRequired(req.body, ['quoteId']);

    const quote = await prisma.quote.findUnique({
      where: { id: Number(quoteId) },
      include: { product: true, user: true, policy: true }
    });
    if (!quote) throw new NotFoundError('Quote');
    if (quote.status !== 'APPROVED') {
      throw new ValidationError('Quote must be approved', [{ field: 'status', message: 'Quote must be approved before issuing policy' }]);
    }
    if (quote.policy) {
      throw new ValidationError('Policy already exists', [{ field: 'policy', message: 'A policy already exists for this quote' }]);
    }

    // Use provided dates or default to today and 1 year from now
    const policyStartDate = startDate ? new Date(startDate) : new Date();
    const policyEndDate = endDate ? new Date(endDate) : (() => {
      const end = new Date();
      end.setFullYear(end.getFullYear() + 1);
      return end;
    })();

    const policy = await prisma.policy.create({
      data: {
        quoteId: quote.id,
        productId: quote.productId,
        userId: quote.userId,
        premium: quote.premium,
        startDate: policyStartDate,
        endDate: policyEndDate,
        premiumPaid: Boolean(premiumPaid),
        policyNumber: `POL-${Date.now()}-${quote.id}`
      },
      include: { product: true, quote: true }
    });

    await logAudit({
      actorId: req.user.id,
      action: 'POLICY_ISSUED',
      entityType: 'Policy',
      entityId: policy.id,
      metadata: { policyNumber: policy.policyNumber }
    });

    // Record Atenxion transaction when customer buys product (policy created)
    recordAtenxionTransaction(policy.userId, 'POLICY_PURCHASED').catch(err => {
      console.error('Failed to record Atenxion transaction for policy purchase:', err);
    });

    res.status(201).json({ success: true, data: policy });
  })
);

router.patch(
  '/:id',
  authenticate,
  authorize(['UNDERWRITER', 'ADMIN']),
  asyncHandler(async (req, res) => {
    const { status, startDate, endDate, premiumPaid } = req.body;
    const policyId = Number(req.params.id);

    const policy = await prisma.policy.findUnique({ where: { id: policyId } });
    if (!policy) throw new NotFoundError('Policy');

    const updateData = {};
    if (status !== undefined) {
      const validStatuses = ['ACTIVE', 'LAPSED', 'CANCELLED', 'RENEWED'];
      if (!validStatuses.includes(status)) {
        throw new ValidationError('Invalid status', [{ field: 'status', message: `Status must be one of: ${validStatuses.join(', ')}` }]);
      }
      updateData.status = status;
    }
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (premiumPaid !== undefined) updateData.premiumPaid = Boolean(premiumPaid);

    const updatedPolicy = await prisma.policy.update({
      where: { id: policyId },
      data: updateData,
      include: { product: true, quote: true }
    });

    await logAudit({
      actorId: req.user.id,
      action: 'POLICY_UPDATED',
      entityType: 'Policy',
      entityId: updatedPolicy.id,
      metadata: { policyNumber: updatedPolicy.policyNumber, changes: updateData }
    });

    res.json({ success: true, data: updatedPolicy });
  })
);

// Endpoint to create policies for all approved quotes without policies (one-time fix)
router.post(
  '/create-missing',
  authenticate,
  authorize(['ADMIN', 'UNDERWRITER']),
  asyncHandler(async (req, res) => {
    const approvedQuotesWithoutPolicies = await prisma.quote.findMany({
      where: {
        status: 'APPROVED',
        policy: null
      },
      include: { product: true, user: true }
    });

    const createdPolicies = [];
    for (const quote of approvedQuotesWithoutPolicies) {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(startDate.getFullYear() + 1);

      const policy = await prisma.policy.create({
        data: {
          quoteId: quote.id,
          productId: quote.productId,
          userId: quote.userId,
          premium: quote.premium,
          startDate: startDate,
          endDate: endDate,
          premiumPaid: false,
          policyNumber: `POL-${Date.now()}-${quote.id}`
        },
        include: { product: true, quote: true }
      });

      await logAudit({
        actorId: req.user.id,
        action: 'POLICY_AUTO_CREATED',
        entityType: 'Policy',
        entityId: policy.id,
        metadata: { policyNumber: policy.policyNumber, quoteId: quote.id }
      });

      // Record Atenxion transaction when customer buys product (policy auto-created)
      recordAtenxionTransaction(policy.userId, 'POLICY_PURCHASED').catch(err => {
        console.error('Failed to record Atenxion transaction for policy purchase:', err);
      });

      createdPolicies.push(policy);
  }

    res.json({
      success: true,
      message: `Created ${createdPolicies.length} policies for approved quotes`,
      data: createdPolicies,
      count: createdPolicies.length
    });
  })
);

module.exports = router;
