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

// POST /api/products/seed - Seed all default products
// Note: Made accessible without admin auth for product restoration
router.post(
  '/seed',
  asyncHandler(async (req, res) => {
    const products = [
      {
        name: 'Health Shield',
        type: 'HEALTH',
        description: 'Comprehensive health insurance covering medical expenses, hospitalization, and preventive care',
        basePremium: 300,
        coverageLimits: { inpatient: 100000, outpatient: 20000, annualLimit: 150000 },
        premiumRules: { smokerMultiplier: 1.3, ageMultiplier: 1.2 },
        exclusions: { items: ['pre-existing conditions', 'cosmetic surgery', 'experimental treatments'] }
      },
      {
        name: 'Life Secure',
        type: 'LIFE',
        description: 'Life insurance coverage with flexible term options and family protection benefits',
        basePremium: 250,
        coverageLimits: { term: 250000, accidentalDeath: 500000 },
        premiumRules: { smokerMultiplier: 1.25, ageFactor: 1.15 },
        exclusions: { items: ['self-inflicted injuries', 'suicide within first year', 'war or terrorism'] }
      },
      {
        name: 'Motor Protect',
        type: 'MOTOR',
        description: 'Comprehensive vehicle insurance for personal cars covering collision, theft, and third-party liability',
        basePremium: 180,
        coverageLimits: { collision: 50000, theft: 20000, liability: 100000 },
        premiumRules: { vehicleValueFactor: 0.01, driverAgeFactor: 1.1 },
        exclusions: { items: ['commercial use', 'racing', 'driving under influence', 'unlicensed driver'] }
      },
      {
        name: 'Travel Guard',
        type: 'TRAVEL',
        description: 'Travel insurance covering trip cancellation, medical emergencies abroad, and lost luggage',
        basePremium: 50,
        coverageLimits: { medical: 100000, tripCancellation: 5000, baggage: 2000 },
        premiumRules: { destinationFactor: 1.2, tripDurationFactor: 1.1 },
        exclusions: { items: ['pre-existing medical conditions', 'extreme sports', 'war zones', 'pandemics'] }
      },
      {
        name: 'Fire Shield',
        type: 'FIRE',
        description: 'Fire insurance protecting your property against fire damage, smoke damage, and related perils',
        basePremium: 200,
        coverageLimits: { building: 500000, contents: 100000, temporaryAccommodation: 50000 },
        premiumRules: { propertyValueFactor: 0.002, fireSafetyFactor: 0.9 },
        exclusions: { items: ['arson by insured', 'war or nuclear hazard', 'gradual deterioration'] }
      },
      {
        name: 'Property Guard',
        type: 'PROPERTY',
        description: 'Property insurance covering buildings and contents against theft, vandalism, and natural disasters',
        basePremium: 220,
        coverageLimits: { building: 750000, contents: 150000, liability: 500000 },
        premiumRules: { propertyValueFactor: 0.0015, locationFactor: 1.1 },
        exclusions: { items: ['wear and tear', 'flood (unless specified)', 'earthquake (unless specified)', 'intentional damage'] }
      },
      {
        name: 'Home Secure',
        type: 'HOME',
        description: 'Homeowners insurance protecting your home, personal belongings, and providing liability coverage',
        basePremium: 280,
        coverageLimits: { dwelling: 500000, personalProperty: 250000, liability: 300000, additionalLiving: 100000 },
        premiumRules: { homeValueFactor: 0.001, locationFactor: 1.15 },
        exclusions: { items: ['flood', 'earthquake', 'normal wear and tear', 'pest damage'] }
      },
      {
        name: 'Business Protect',
        type: 'BUSINESS',
        description: 'Business insurance covering property, liability, business interruption, and equipment',
        basePremium: 400,
        coverageLimits: { property: 1000000, liability: 2000000, businessInterruption: 500000, equipment: 300000 },
        premiumRules: { revenueFactor: 0.0005, employeeCountFactor: 1.1 },
        exclusions: { items: ['cyber attacks (separate policy)', 'professional liability (separate policy)', 'employee dishonesty'] }
      },
      {
        name: 'Liability Shield',
        type: 'LIABILITY',
        description: 'General liability insurance protecting against claims of bodily injury, property damage, and personal injury',
        basePremium: 350,
        coverageLimits: { generalLiability: 2000000, productLiability: 1000000, personalInjury: 500000 },
        premiumRules: { businessTypeFactor: 1.2, revenueFactor: 0.0003 },
        exclusions: { items: ['professional services', 'intentional acts', 'pollution', 'contractual liability'] }
      }
    ];

    const seededProducts = [];
    for (const product of products) {
      let existing = await prisma.product.findFirst({
        where: { name: product.name }
      });
      
      if (existing) {
        existing = await prisma.product.update({
          where: { id: existing.id },
          data: {
            type: product.type,
            description: product.description,
            basePremium: product.basePremium,
            coverageLimits: product.coverageLimits,
            premiumRules: product.premiumRules,
            exclusions: product.exclusions,
          }
        });
      } else {
        existing = await prisma.product.create({
          data: product
        });
      }
      seededProducts.push(existing);
    }

    res.json({
      success: true,
      message: `Successfully seeded ${seededProducts.length} products`,
      data: seededProducts,
      count: seededProducts.length
    });
  })
);

module.exports = router;
