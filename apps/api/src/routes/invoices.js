const express = require('express');
const prisma = require('../prisma');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

const STAFF_ROLES = ['ADMIN', 'AGENT', 'UNDERWRITER', 'CLAIMS_OFFICER'];

router.get('/', authenticate, async (req, res) => {
  const where = STAFF_ROLES.includes(req.user.role) ? {} : { policy: { userId: req.user.id } };
  const invoices = await prisma.invoice.findMany({ where, include: { policy: true } });
  res.json(invoices);
});

router.post('/', authenticate, authorize(['ADMIN', 'AGENT']), async (req, res) => {
  try {
    const { policyId, amount, dueDate } = req.body;
    const policy = await prisma.policy.findUnique({ where: { id: Number(policyId) } });
    if (!policy) return res.status(404).json({ message: 'Policy not found' });

    const invoice = await prisma.invoice.create({
      data: {
        policyId: policy.id,
        number: `INV-${Date.now()}`,
        amount: Number(amount),
        dueDate: new Date(dueDate)
      }
    });

    res.status(201).json(invoice);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Failed to create invoice' });
  }
});

module.exports = router;
