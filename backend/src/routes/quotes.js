const express = require('express');
const prisma = require('../prisma');
const { authenticate, authorize } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const { NotFoundError, ValidationError } = require('../utils/errors');
const { validateRequired, validateNumber } = require('../utils/validation');
const { calculatePremium } = require('../services/premiumService');
const { logAudit } = require('../services/auditLogService');
const router = express.Router();

const STAFF_ROLES = ['ADMIN', 'AGENT', 'UNDERWRITER', 'CLAIMS_OFFICER'];

router.post(
  '/',
  authenticate,
  authorize(['CUSTOMER', 'ADMIN', 'AGENT']),
  asyncHandler(async (req, res) => {
    validateRequired(req.body, ['productId']);
    const { productId, metadata = {}, status = 'PENDING', version = 1 } = req.body;
    
    const product = await prisma.product.findUnique({ where: { id: validateNumber(productId, 'Product ID') } });
    if (!product) throw new NotFoundError('Product');

    const premium = calculatePremium(product.basePremium, metadata);
    const quote = await prisma.quote.create({
      data: {
        productId: product.id,
        userId: req.user.id,
        metadata,
        premium,
        status,
        version
      },
      include: { product: true }
    });
    res.status(201).json({ success: true, data: quote });
  })
);

router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
  const where = STAFF_ROLES.includes(req.user.role) ? {} : { userId: req.user.id };
    const quotes = await prisma.quote.findMany({
      where,
      include: { product: true, user: true, policy: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: quotes, count: quotes.length });
  })
);

router.patch(
  '/:id/status',
  authenticate,
  authorize(['UNDERWRITER', 'ADMIN']),
  asyncHandler(async (req, res) => {
    const { status } = req.body;
    validateRequired(req.body, ['status']);
    
    const validStatuses = ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      throw new ValidationError('Invalid status', [{ field: 'status', message: `Status must be one of: ${validStatuses.join(', ')}` }]);
    }

    const quote = await prisma.quote.findUnique({ 
      where: { id: Number(req.params.id) },
      include: { product: true, user: true, policy: true }
    });
    if (!quote) throw new NotFoundError('Quote');

    // If approving and no policy exists, automatically create one
    if (status === 'APPROVED' && !quote.policy) {
      // Set default dates: start today, end 1 year from now
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
        action: 'POLICY_AUTO_ISSUED',
        entityType: 'Policy',
        entityId: policy.id,
        metadata: { policyNumber: policy.policyNumber, quoteId: quote.id }
      });
    }

    const updatedQuote = await prisma.quote.update({
      where: { id: Number(req.params.id) },
      data: { status },
      include: { product: true, user: true, policy: true }
    });

    res.json({ success: true, data: updatedQuote });
  })
);

module.exports = router;
