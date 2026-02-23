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
      // Health Shield Plans
      {
        name: 'Health Shield - Basic',
        type: 'HEALTH',
        description: 'Comprehensive health coverage for you and your family',
        basePremium: 1200,
        coverageLimits: { inpatient: 50000, outpatient: 20000, annualLimit: 50000 },
        premiumRules: { smokerMultiplier: 1.3, ageMultiplier: 1.2 },
        exclusions: { items: ['pre-existing conditions', 'cosmetic surgery', 'experimental treatments'] }
      },
      {
        name: 'Health Shield - Standard',
        type: 'HEALTH',
        description: 'Comprehensive health coverage for you and your family',
        basePremium: 2400,
        coverageLimits: { inpatient: 100000, outpatient: 20000, annualLimit: 100000 },
        premiumRules: { smokerMultiplier: 1.3, ageMultiplier: 1.2 },
        exclusions: { items: ['pre-existing conditions', 'cosmetic surgery', 'experimental treatments'] }
      },
      {
        name: 'Health Shield - Premium',
        type: 'HEALTH',
        description: 'Comprehensive health coverage for you and your family',
        basePremium: 3600,
        coverageLimits: { inpatient: 200000, outpatient: 20000, annualLimit: 200000 },
        premiumRules: { smokerMultiplier: 1.3, ageMultiplier: 1.2 },
        exclusions: { items: ['pre-existing conditions', 'cosmetic surgery', 'experimental treatments'] }
      },
      {
        name: 'Health Shield - Ultra Premium',
        type: 'HEALTH',
        description: 'Comprehensive health coverage for you and your family',
        basePremium: 6000,
        coverageLimits: { inpatient: 999999999, outpatient: 20000, annualLimit: 999999999 },
        premiumRules: { smokerMultiplier: 1.3, ageMultiplier: 1.2 },
        exclusions: { items: ['pre-existing conditions', 'cosmetic surgery', 'experimental treatments'] }
      },
      // Life Secure Plans
      {
        name: 'Life Secure - Basic',
        type: 'LIFE',
        description: 'Secure your family\'s future with comprehensive life coverage',
        basePremium: 1500,
        coverageLimits: { term: 100000, accidentalDeath: 100000, criticalIllness: 100000 },
        premiumRules: { smokerMultiplier: 1.25, ageFactor: 1.15 },
        exclusions: { items: ['self-inflicted injuries', 'suicide within first year', 'war or terrorism'] }
      },
      {
        name: 'Life Secure - Standard',
        type: 'LIFE',
        description: 'Secure your family\'s future with comprehensive life coverage',
        basePremium: 3000,
        coverageLimits: { term: 250000, accidentalDeath: 250000, criticalIllness: 250000 },
        premiumRules: { smokerMultiplier: 1.25, ageFactor: 1.15 },
        exclusions: { items: ['self-inflicted injuries', 'suicide within first year', 'war or terrorism'] }
      },
      {
        name: 'Life Secure - Premium',
        type: 'LIFE',
        description: 'Secure your family\'s future with comprehensive life coverage',
        basePremium: 5000,
        coverageLimits: { term: 500000, accidentalDeath: 500000, criticalIllness: 500000 },
        premiumRules: { smokerMultiplier: 1.25, ageFactor: 1.15 },
        exclusions: { items: ['self-inflicted injuries', 'suicide within first year', 'war or terrorism'] }
      },
      {
        name: 'Life Secure - Ultra Premium',
        type: 'LIFE',
        description: 'Secure your family\'s future with comprehensive life coverage',
        basePremium: 10000,
        coverageLimits: { term: 1000000, accidentalDeath: 1000000, criticalIllness: 1000000 },
        premiumRules: { smokerMultiplier: 1.25, ageFactor: 1.15 },
        exclusions: { items: ['self-inflicted injuries', 'suicide within first year', 'war or terrorism'] }
      },
      // Motor Protect Plans
      {
        name: 'Motor Protect - Basic',
        type: 'MOTOR',
        description: 'Complete vehicle protection with flexible coverage options',
        basePremium: 800,
        coverageLimits: { thirdPartyLiability: 100000, fireTheft: 20000, roadsideAssistance: true },
        premiumRules: { vehicleValueFactor: 0.01, driverAgeFactor: 1.1 },
        exclusions: { items: ['commercial use', 'racing', 'driving under influence', 'unlicensed driver'] }
      },
      {
        name: 'Motor Protect - Standard',
        type: 'MOTOR',
        description: 'Complete vehicle protection with flexible coverage options',
        basePremium: 1500,
        coverageLimits: { thirdPartyLiability: 100000, fireTheft: 20000, roadsideAssistance: true, comprehensive: true },
        premiumRules: { vehicleValueFactor: 0.01, driverAgeFactor: 1.1 },
        exclusions: { items: ['commercial use', 'racing', 'driving under influence', 'unlicensed driver'] }
      },
      {
        name: 'Motor Protect - Premium',
        type: 'MOTOR',
        description: 'Complete vehicle protection with flexible coverage options',
        basePremium: 2500,
        coverageLimits: { thirdPartyLiability: 100000, fireTheft: 20000, roadsideAssistance: true, comprehensive: true, personalAccident: true },
        premiumRules: { vehicleValueFactor: 0.01, driverAgeFactor: 1.1 },
        exclusions: { items: ['commercial use', 'racing', 'driving under influence', 'unlicensed driver'] }
      },
      {
        name: 'Motor Protect - Ultra Premium',
        type: 'MOTOR',
        description: 'Complete vehicle protection with flexible coverage options',
        basePremium: 4000,
        coverageLimits: { thirdPartyLiability: 100000, fireTheft: 20000, roadsideAssistance: true, comprehensive: true, personalAccident: true, rentalCar: true },
        premiumRules: { vehicleValueFactor: 0.01, driverAgeFactor: 1.1 },
        exclusions: { items: ['commercial use', 'racing', 'driving under influence', 'unlicensed driver'] }
      },
      // Travel Guard Plans
      {
        name: 'Travel Guard - Basic',
        type: 'TRAVEL',
        description: 'Travel with confidence and peace of mind',
        basePremium: 50,
        coverageLimits: { medical: 50000, tripCancellation: 5000, baggage: 2000, flightDelay: true },
        premiumRules: { destinationFactor: 1.2, tripDurationFactor: 1.1 },
        exclusions: { items: ['pre-existing medical conditions', 'extreme sports', 'war zones', 'pandemics'] }
      },
      {
        name: 'Travel Guard - Standard',
        type: 'TRAVEL',
        description: 'Travel with confidence and peace of mind',
        basePremium: 100,
        coverageLimits: { medical: 100000, tripCancellation: 5000, baggage: 2000, flightDelay: true, tripInterruption: true },
        premiumRules: { destinationFactor: 1.2, tripDurationFactor: 1.1 },
        exclusions: { items: ['pre-existing medical conditions', 'extreme sports', 'war zones', 'pandemics'] }
      },
      {
        name: 'Travel Guard - Premium',
        type: 'TRAVEL',
        description: 'Travel with confidence and peace of mind',
        basePremium: 200,
        coverageLimits: { medical: 200000, tripCancellation: 5000, baggage: 2000, flightDelay: true, tripInterruption: true, adventureSports: true },
        premiumRules: { destinationFactor: 1.2, tripDurationFactor: 1.1 },
        exclusions: { items: ['pre-existing medical conditions', 'extreme sports', 'war zones', 'pandemics'] }
      },
      {
        name: 'Travel Guard - Ultra Premium',
        type: 'TRAVEL',
        description: 'Travel with confidence and peace of mind',
        basePremium: 400,
        coverageLimits: { medical: 500000, tripCancellation: 5000, baggage: 2000, flightDelay: true, tripInterruption: true, adventureSports: true, concierge: true },
        premiumRules: { destinationFactor: 1.2, tripDurationFactor: 1.1 },
        exclusions: { items: ['pre-existing medical conditions', 'extreme sports', 'war zones', 'pandemics'] }
      },
      // Fire Shield Plans
      {
        name: 'Fire Shield - Basic',
        type: 'FIRE',
        description: 'Protect your property against fire damage and related perils',
        basePremium: 600,
        coverageLimits: { building: 200000, contents: 200000, smokeDamage: true, lightning: true, explosion: true },
        premiumRules: { propertyValueFactor: 0.002, fireSafetyFactor: 0.9 },
        exclusions: { items: ['arson by insured', 'war or nuclear hazard', 'gradual deterioration'] }
      },
      {
        name: 'Fire Shield - Standard',
        type: 'FIRE',
        description: 'Protect your property against fire damage and related perils',
        basePremium: 1200,
        coverageLimits: { building: 500000, contents: 500000, smokeDamage: true, lightning: true, explosion: true, temporaryAccommodation: true },
        premiumRules: { propertyValueFactor: 0.002, fireSafetyFactor: 0.9 },
        exclusions: { items: ['arson by insured', 'war or nuclear hazard', 'gradual deterioration'] }
      },
      {
        name: 'Fire Shield - Premium',
        type: 'FIRE',
        description: 'Protect your property against fire damage and related perils',
        basePremium: 2000,
        coverageLimits: { building: 1000000, contents: 1000000, smokeDamage: true, lightning: true, explosion: true, temporaryAccommodation: true, contentsReplacement: true },
        premiumRules: { propertyValueFactor: 0.002, fireSafetyFactor: 0.9 },
        exclusions: { items: ['arson by insured', 'war or nuclear hazard', 'gradual deterioration'] }
      },
      {
        name: 'Fire Shield - Ultra Premium',
        type: 'FIRE',
        description: 'Protect your property against fire damage and related perils',
        basePremium: 3500,
        coverageLimits: { building: 999999999, contents: 999999999, smokeDamage: true, lightning: true, explosion: true, temporaryAccommodation: true, contentsReplacement: true, lossOfRent: true },
        premiumRules: { propertyValueFactor: 0.002, fireSafetyFactor: 0.9 },
        exclusions: { items: ['arson by insured', 'war or nuclear hazard', 'gradual deterioration'] }
      },
      // Property Guard Plans
      {
        name: 'Property Guard - Basic',
        type: 'PROPERTY',
        description: 'Comprehensive protection for your commercial and residential properties',
        basePremium: 800,
        coverageLimits: { building: 300000, contents: 300000, theft: true, vandalism: true, naturalDisaster: true },
        premiumRules: { propertyValueFactor: 0.0015, locationFactor: 1.1 },
        exclusions: { items: ['wear and tear', 'flood (unless specified)', 'earthquake (unless specified)', 'intentional damage'] }
      },
      {
        name: 'Property Guard - Standard',
        type: 'PROPERTY',
        description: 'Comprehensive protection for your commercial and residential properties',
        basePremium: 1500,
        coverageLimits: { building: 750000, contents: 750000, theft: true, vandalism: true, naturalDisaster: true, liability: true, lossOfRent: true },
        premiumRules: { propertyValueFactor: 0.0015, locationFactor: 1.1 },
        exclusions: { items: ['wear and tear', 'flood (unless specified)', 'earthquake (unless specified)', 'intentional damage'] }
      },
      {
        name: 'Property Guard - Premium',
        type: 'PROPERTY',
        description: 'Comprehensive protection for your commercial and residential properties',
        basePremium: 2800,
        coverageLimits: { building: 1500000, contents: 1500000, theft: true, vandalism: true, naturalDisaster: true, liability: true, lossOfRent: true, equipmentBreakdown: true },
        premiumRules: { propertyValueFactor: 0.0015, locationFactor: 1.1 },
        exclusions: { items: ['wear and tear', 'flood (unless specified)', 'earthquake (unless specified)', 'intentional damage'] }
      },
      {
        name: 'Property Guard - Ultra Premium',
        type: 'PROPERTY',
        description: 'Comprehensive protection for your commercial and residential properties',
        basePremium: 5000,
        coverageLimits: { building: 999999999, contents: 999999999, theft: true, vandalism: true, naturalDisaster: true, liability: true, lossOfRent: true, equipmentBreakdown: true, businessInterruption: true },
        premiumRules: { propertyValueFactor: 0.0015, locationFactor: 1.1 },
        exclusions: { items: ['wear and tear', 'flood (unless specified)', 'earthquake (unless specified)', 'intentional damage'] }
      },
      // Home Secure Plans
      {
        name: 'Home Secure - Basic',
        type: 'HOME',
        description: 'Complete protection for your home and personal belongings',
        basePremium: 700,
        coverageLimits: { dwelling: 400000, personalProperty: 50000, liability: 100000, theft: true, naturalDisaster: true },
        premiumRules: { homeValueFactor: 0.001, locationFactor: 1.15 },
        exclusions: { items: ['flood', 'earthquake', 'normal wear and tear', 'pest damage'] }
      },
      {
        name: 'Home Secure - Standard',
        type: 'HOME',
        description: 'Complete protection for your home and personal belongings',
        basePremium: 1400,
        coverageLimits: { dwelling: 800000, personalProperty: 150000, liability: 300000, theft: true, naturalDisaster: true, temporaryAccommodation: true },
        premiumRules: { homeValueFactor: 0.001, locationFactor: 1.15 },
        exclusions: { items: ['flood', 'earthquake', 'normal wear and tear', 'pest damage'] }
      },
      {
        name: 'Home Secure - Premium',
        type: 'HOME',
        description: 'Complete protection for your home and personal belongings',
        basePremium: 2500,
        coverageLimits: { dwelling: 1500000, personalProperty: 300000, liability: 500000, theft: true, naturalDisaster: true, temporaryAccommodation: true, jewelry: true },
        premiumRules: { homeValueFactor: 0.001, locationFactor: 1.15 },
        exclusions: { items: ['flood', 'earthquake', 'normal wear and tear', 'pest damage'] }
      },
      {
        name: 'Home Secure - Ultra Premium',
        type: 'HOME',
        description: 'Complete protection for your home and personal belongings',
        basePremium: 4500,
        coverageLimits: { dwelling: 999999999, personalProperty: 500000, liability: 1000000, theft: true, naturalDisaster: true, temporaryAccommodation: true, jewelry: true, identityTheft: true },
        premiumRules: { homeValueFactor: 0.001, locationFactor: 1.15 },
        exclusions: { items: ['flood', 'earthquake', 'normal wear and tear', 'pest damage'] }
      },
      // Business Protect Plans
      {
        name: 'Business Protect - Basic',
        type: 'BUSINESS',
        description: 'Comprehensive coverage for your business operations and assets',
        basePremium: 1500,
        coverageLimits: { property: 500000, liability: 1000000, businessInterruption: 500000, equipment: 500000 },
        premiumRules: { revenueFactor: 0.0005, employeeCountFactor: 1.1 },
        exclusions: { items: ['cyber attacks (separate policy)', 'professional liability (separate policy)', 'employee dishonesty'] }
      },
      {
        name: 'Business Protect - Standard',
        type: 'BUSINESS',
        description: 'Comprehensive coverage for your business operations and assets',
        basePremium: 3000,
        coverageLimits: { property: 1500000, liability: 2000000, businessInterruption: 500000, equipment: 500000, employeeLiability: true },
        premiumRules: { revenueFactor: 0.0005, employeeCountFactor: 1.1 },
        exclusions: { items: ['cyber attacks (separate policy)', 'professional liability (separate policy)', 'employee dishonesty'] }
      },
      {
        name: 'Business Protect - Premium',
        type: 'BUSINESS',
        description: 'Comprehensive coverage for your business operations and assets',
        basePremium: 6000,
        coverageLimits: { property: 5000000, liability: 5000000, businessInterruption: 500000, equipment: 500000, employeeLiability: true, professionalIndemnity: true },
        premiumRules: { revenueFactor: 0.0005, employeeCountFactor: 1.1 },
        exclusions: { items: ['cyber attacks (separate policy)', 'professional liability (separate policy)', 'employee dishonesty'] }
      },
      {
        name: 'Business Protect - Ultra Premium',
        type: 'BUSINESS',
        description: 'Comprehensive coverage for your business operations and assets',
        basePremium: 12000,
        coverageLimits: { property: 999999999, liability: 10000000, businessInterruption: 500000, equipment: 500000, employeeLiability: true, professionalIndemnity: true, international: true },
        premiumRules: { revenueFactor: 0.0005, employeeCountFactor: 1.1 },
        exclusions: { items: ['cyber attacks (separate policy)', 'professional liability (separate policy)', 'employee dishonesty'] }
      },
      // Liability Shield Plans
      {
        name: 'Liability Shield - Basic',
        type: 'LIABILITY',
        description: 'Protect your business from third-party claims and legal liabilities',
        basePremium: 1000,
        coverageLimits: { generalLiability: 1000000, productLiability: 1000000, personalInjury: 1000000, legalDefense: true },
        premiumRules: { businessTypeFactor: 1.2, revenueFactor: 0.0003 },
        exclusions: { items: ['professional services', 'intentional acts', 'pollution', 'contractual liability'] }
      },
      {
        name: 'Liability Shield - Standard',
        type: 'LIABILITY',
        description: 'Protect your business from third-party claims and legal liabilities',
        basePremium: 2000,
        coverageLimits: { generalLiability: 2000000, productLiability: 2000000, personalInjury: 2000000, legalDefense: true, completedOperations: true },
        premiumRules: { businessTypeFactor: 1.2, revenueFactor: 0.0003 },
        exclusions: { items: ['professional services', 'intentional acts', 'pollution', 'contractual liability'] }
      },
      {
        name: 'Liability Shield - Premium',
        type: 'LIABILITY',
        description: 'Protect your business from third-party claims and legal liabilities',
        basePremium: 4000,
        coverageLimits: { generalLiability: 5000000, productLiability: 5000000, personalInjury: 5000000, legalDefense: true, completedOperations: true, advertisingInjury: true },
        premiumRules: { businessTypeFactor: 1.2, revenueFactor: 0.0003 },
        exclusions: { items: ['professional services', 'intentional acts', 'pollution', 'contractual liability'] }
      },
      {
        name: 'Liability Shield - Ultra Premium',
        type: 'LIABILITY',
        description: 'Protect your business from third-party claims and legal liabilities',
        basePremium: 8000,
        coverageLimits: { generalLiability: 10000000, productLiability: 10000000, personalInjury: 10000000, legalDefense: true, completedOperations: true, advertisingInjury: true, international: true },
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
