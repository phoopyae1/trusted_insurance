const express = require('express');
const prisma = require('../prisma');
const { authenticate, authorize } = require('../middleware/auth');
const { calculatePremium } = require('../services/premiumService');
const router = express.Router();

router.post('/', authenticate, authorize(['CUSTOMER', 'ADMIN', 'STAFF']), async (req, res) => {
  try {
    const { productId, metadata = {} } = req.body;
    const product = await prisma.product.findUnique({ where: { id: Number(productId) } });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const premium = calculatePremium(product.basePremium, metadata);
    const quote = await prisma.quote.create({
      data: {
        productId: product.id,
        userId: req.user.id,
        metadata,
        premium
      },
      include: { product: true }
    });
    res.status(201).json(quote);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Failed to create quote' });
  }
});

router.get('/', authenticate, async (req, res) => {
  const where = ['ADMIN', 'STAFF'].includes(req.user.role) ? {} : { userId: req.user.id };
  const quotes = await prisma.quote.findMany({ where, include: { product: true, user: true } });
  res.json(quotes);
});

router.patch('/:id/status', authenticate, authorize(['STAFF', 'ADMIN']), async (req, res) => {
  try {
    const { status } = req.body;
    const quote = await prisma.quote.update({ where: { id: Number(req.params.id) }, data: { status } });
    res.json(quote);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Unable to update quote status' });
  }
});

module.exports = router;
