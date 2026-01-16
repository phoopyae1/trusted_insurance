const express = require('express');
const prisma = require('../prisma');
const { authenticate, authorize } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const { logAudit } = require('../services/auditLogService');
const { NotFoundError } = require('../utils/errors');
const { validateRequired, validateNumber } = require('../utils/validation');
const router = express.Router();

const STAFF_ROLES = ['ADMIN', 'AGENT', 'UNDERWRITER', 'CLAIMS_OFFICER'];

router.get('/', authenticate, async (req, res) => {
  const where = STAFF_ROLES.includes(req.user.role) ? {} : { userId: req.user.id };
  const payments = await prisma.payment.findMany({ where, include: { policy: true } });
  res.json(payments);
});

router.post(
  '/',
  authenticate,
  authorize(['ADMIN', 'AGENT', 'UNDERWRITER']),
  asyncHandler(async (req, res) => {
    const { policyId, amount, method, reference, status } = req.body;
    validateRequired(req.body, ['policyId']);
    
    const policy = await prisma.policy.findUnique({ where: { id: Number(policyId) } });
    if (!policy) throw new NotFoundError('Policy');

    const paymentAmount = amount ? validateNumber(amount, 'Amount') : policy.premium;

    const payment = await prisma.payment.create({
      data: {
        policyId: policy.id,
        userId: policy.userId,
        amount: paymentAmount,
        method: method || 'MANUAL',
        reference: reference || null,
        status: status || 'PAID'
      }
    });

    // Automatically mark policy premium as paid when payment is recorded
    if (status === 'PAID' || !status) {
      await prisma.policy.update({
        where: { id: policy.id },
        data: { premiumPaid: true }
      });
    }

    await logAudit({
      actorId: req.user.id,
      action: 'PAYMENT_RECORDED',
      entityType: 'Payment',
      entityId: payment.id,
      metadata: { amount: payment.amount, policyId: policy.id }
    });

    res.status(201).json({ success: true, data: payment });
  })
);

module.exports = router;
