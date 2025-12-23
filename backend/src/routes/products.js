const express = require('express');
const prisma = require('../prisma');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

router.get('/', async (_req, res) => {
  const products = await prisma.product.findMany();
  return res.json(products);
});

router.post('/', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const product = await prisma.product.create({ data: req.body });
    return res.status(201).json(product);
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: 'Failed to create product' });
  }
});

router.put('/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const product = await prisma.product.update({ where: { id: Number(req.params.id) }, data: req.body });
    return res.json(product);
  } catch (err) {
    console.error(err);
    return res.status(404).json({ message: 'Product not found' });
  }
});

router.delete('/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: Number(req.params.id) } });
    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(404).json({ message: 'Product not found' });
  }
});

module.exports = router;
