const express = require('express');
const prisma = require('../prisma');
const { authenticate, authorize } = require('../middleware/auth');
const { logAudit } = require('../services/auditLogService');
const router = express.Router();

const STAFF_ROLES = ['ADMIN', 'AGENT', 'UNDERWRITER', 'CLAIMS_OFFICER'];

router.get('/', authenticate, async (req, res) => {
  const where = STAFF_ROLES.includes(req.user.role) ? {} : { userId: req.user.id };
  const payments = await prisma.payment.findMany({ where, include: { policy: true } });
  res.json(payments);
});

router.post('/', authenticate, authorize(['ADMIN', 'AGENT']), async (req, res) => {
  try {
    const { policyId, amount, method, reference, status } = req.body;
    const policy = await prisma.policy.findUnique({ where: { id: Number(policyId) } });
    if (!policy) return res.status(404).json({ message: 'Policy not found' });

    const payment = await prisma.payment.create({
      data: {
        policyId: policy.id,
        userId: policy.userId,
        amount: Number(amount),
        method,
        reference,
        status: status || 'PAID'
      }
    });

    await logAudit({
      actorId: req.user.id,
      action: 'PAYMENT_RECORDED',
      entityType: 'Payment',
      entityId: payment.id,
      metadata: { amount: payment.amount, policyId: policy.id }
    });

    res.status(201).json(payment);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Failed to record payment' });
  }
});

module.exports = router;
