const express = require('express');
const prisma = require('../prisma');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  const where = ['ADMIN', 'STAFF'].includes(req.user.role) ? {} : { userId: req.user.id };
  const policies = await prisma.policy.findMany({ where, include: { product: true, quote: true } });
  res.json(policies);
});

router.post('/', authenticate, authorize(['STAFF']), async (req, res) => {
  try {
    const { quoteId, startDate, endDate, premiumPaid } = req.body;
    const quote = await prisma.quote.findUnique({ where: { id: Number(quoteId) }, include: { product: true, user: true, policy: true } });
    if (!quote) return res.status(404).json({ message: 'Quote not found' });
    if (quote.status !== 'APPROVED') return res.status(400).json({ message: 'Quote must be approved before issuing policy' });
    if (quote.policy) return res.status(400).json({ message: 'Policy already exists' });

    const policy = await prisma.policy.create({
      data: {
        quoteId: quote.id,
        productId: quote.productId,
        userId: quote.userId,
        premium: quote.premium,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        premiumPaid: Boolean(premiumPaid),
        policyNumber: `POL-${Date.now()}`
      },
      include: { product: true, quote: true }
    });
    res.status(201).json(policy);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Failed to issue policy' });
  }
});

module.exports = router;
