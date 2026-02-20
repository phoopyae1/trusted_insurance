const express = require('express');
const prisma = require('../prisma');
const { authenticate, authorize } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const { NotFoundError, ValidationError } = require('../utils/errors');
const { validateRequired, validateNumber } = require('../utils/validation');
const { calculatePremium } = require('../services/premiumService');
const { logAudit } = require('../services/auditLogService');
const { recordAtenxionTransaction } = require('../services/atenxionTransactionService');
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
    const { status, premiumPaid, startDate, endDate } = req.body;
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
      // Use provided dates or set default dates: start today, end 1 year from now
      const policyStartDate = startDate ? new Date(startDate) : new Date();
      const policyEndDate = endDate ? new Date(endDate) : new Date();
      if (!endDate) {
        policyEndDate.setFullYear(policyStartDate.getFullYear() + 1);
      }

      // Validate dates
      if (policyEndDate <= policyStartDate) {
        throw new ValidationError('Invalid dates', [{ 
          field: 'endDate', 
          message: 'End date must be after start date' 
        }]);
      }

      // Use premiumPaid from request body if provided, otherwise default to false
      const isPremiumPaid = premiumPaid === true || premiumPaid === 'true';

      const policy = await prisma.policy.create({
        data: {
          quoteId: quote.id,
          productId: quote.productId,
          userId: quote.userId,
          premium: quote.premium,
          startDate: policyStartDate,
          endDate: policyEndDate,
          premiumPaid: isPremiumPaid,
          policyNumber: `POL-${Date.now()}-${quote.id}`
        },
        include: { product: true, quote: true }
      });

      await logAudit({
        actorId: req.user.id,
        action: 'POLICY_AUTO_ISSUED',
        entityType: 'Policy',
        entityId: policy.id,
        metadata: { 
          policyNumber: policy.policyNumber, 
          quoteId: quote.id,
          premiumPaid: isPremiumPaid,
          startDate: policyStartDate.toISOString(),
          endDate: policyEndDate.toISOString()
        }
      });
    } else if (status === 'APPROVED' && quote.policy) {
      // If policy already exists and quote is being approved, update fields if provided
      const updateData = {};
      
      if (premiumPaid !== undefined) {
        updateData.premiumPaid = premiumPaid === true || premiumPaid === 'true';
      }
      
      if (startDate) {
        updateData.startDate = new Date(startDate);
      }
      
      if (endDate) {
        updateData.endDate = new Date(endDate);
      }
      
      // Validate dates if both are provided
      if (startDate && endDate) {
        const newStartDate = new Date(startDate);
        const newEndDate = new Date(endDate);
        if (newEndDate <= newStartDate) {
          throw new ValidationError('Invalid dates', [{ 
            field: 'endDate', 
            message: 'End date must be after start date' 
          }]);
        }
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.policy.update({
          where: { id: quote.policy.id },
          data: updateData
        });

        await logAudit({
          actorId: req.user.id,
          action: 'POLICY_UPDATED',
          entityType: 'Policy',
          entityId: quote.policy.id,
          metadata: { 
            policyNumber: quote.policy.policyNumber,
            ...updateData
          }
        });
      }
    }

    const updatedQuote = await prisma.quote.update({
      where: { id: Number(req.params.id) },
      data: { status },
      include: { product: true, user: true, policy: true }
    });

    // Record Atenxion transaction when quote is approved (customer buys product)
    if (status === 'APPROVED') {
      recordAtenxionTransaction(quote.userId, 'POLICY_PURCHASED').catch(err => {
        console.error('Failed to record Atenxion transaction for quote approval:', err);
      });
  }

    res.json({ success: true, data: updatedQuote });
  })
);

module.exports = router;
