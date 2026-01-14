const express = require('express');
const prisma = require('../prisma');
const { authenticate, authorize } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const { NotFoundError, ValidationError } = require('../utils/errors');
const { validateRequired, validateNumber } = require('../utils/validation');
const router = express.Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({
      success: true,
      data: products,
      count: products.length
    });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = validateNumber(req.params.id, 'ID');
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundError('Product');
    res.json({ success: true, data: product });
  })
);

router.post(
  '/',
  authenticate,
  authorize(['ADMIN']),
  asyncHandler(async (req, res) => {
    validateRequired(req.body, ['name', 'type', 'description', 'basePremium']);
    const product = await prisma.product.create({ data: req.body });
    res.status(201).json({ success: true, data: product });
  })
);

router.put(
  '/:id',
  authenticate,
  authorize(['ADMIN']),
  asyncHandler(async (req, res) => {
    const id = validateNumber(req.params.id, 'ID');
    const product = await prisma.product.update({
      where: { id },
      data: req.body
    });
    res.json({ success: true, data: product });
  })
);

router.delete(
  '/:id',
  authenticate,
  authorize(['ADMIN']),
  asyncHandler(async (req, res) => {
    const id = validateNumber(req.params.id, 'ID');
    await prisma.product.delete({ where: { id } });
    res.status(204).send();
  })
);

module.exports = router;
