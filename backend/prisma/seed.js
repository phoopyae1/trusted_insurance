const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const agentPassword = await bcrypt.hash('agent123', 10);
  const underwriterPassword = await bcrypt.hash('underwriter123', 10);
  const claimsPassword = await bcrypt.hash('claims123', 10);
  const customerPassword = await bcrypt.hash('customer123', 10);

  const [admin, agent, underwriter, claimsOfficer, customer] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@insurance.com' },
      update: {},
      create: {
        email: 'admin@insurance.com',
        name: 'Admin User',
        password: adminPassword,
        role: 'ADMIN'
      }
    }),
    prisma.user.upsert({
      where: { email: 'agent@insurance.com' },
      update: {},
      create: {
        email: 'agent@insurance.com',
        name: 'Agent User',
        password: agentPassword,
        role: 'AGENT'
      }
    }),
    prisma.user.upsert({
      where: { email: 'underwriter@insurance.com' },
      update: {},
      create: {
        email: 'underwriter@insurance.com',
        name: 'Underwriter User',
        password: underwriterPassword,
        role: 'UNDERWRITER'
      }
    }),
    prisma.user.upsert({
      where: { email: 'claims@insurance.com' },
      update: {},
      create: {
        email: 'claims@insurance.com',
        name: 'Claims Officer',
        password: claimsPassword,
        role: 'CLAIMS_OFFICER'
      }
    }),
    prisma.user.upsert({
      where: { email: 'customer@insurance.com' },
      update: {},
      create: {
        email: 'customer@insurance.com',
        name: 'Customer One',
        password: customerPassword,
        role: 'CUSTOMER'
      }
    })
  ]);

  await prisma.customerProfile.upsert({
    where: { userId: customer.id },
    update: {},
    create: {
      userId: customer.id,
      phone: '+1 555-100-2000',
      address: '123 Market Street, San Francisco, CA',
      dateOfBirth: new Date('1990-04-12'),
      kycDocs: [{ type: 'passport', status: 'verified', uploadedAt: new Date().toISOString() }],
      dependents: [{ name: 'Jamie Doe', relationship: 'Spouse', age: 33 }]
    }
  });

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
    // Find existing product by name
    let existing = await prisma.product.findFirst({
      where: { name: product.name }
    });
    
    if (existing) {
      // Update existing product with latest data
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
      // Create new product
      existing = await prisma.product.create({
        data: product
      });
    }
    seededProducts.push(existing);
  }
  
  console.log(`✅ Seeded ${seededProducts.length} products:`, seededProducts.map(p => `${p.name} (${p.type})`).join(', '));

  const quote = await prisma.quote.create({
    data: {
      userId: customer.id,
      productId: seededProducts[0].id,
      premium: 420,
      status: 'APPROVED',
      metadata: { age: 33, smoker: false }
    }
  });

  const policy = await prisma.policy.create({
    data: {
      quoteId: quote.id,
      productId: quote.productId,
      userId: customer.id,
      premium: quote.premium,
      startDate: new Date(),
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      premiumPaid: true,
      status: 'ACTIVE',
      policyNumber: `POL-${Date.now()}`
    }
  });

  const invoice = await prisma.invoice.create({
    data: {
      policyId: policy.id,
      number: `INV-${Date.now()}`,
      amount: quote.premium,
      status: 'PAID',
      dueDate: new Date(),
      paidAt: new Date()
    }
  });

  const payment = await prisma.payment.create({
    data: {
      policyId: policy.id,
      userId: customer.id,
      amount: quote.premium,
      method: 'card',
      reference: 'PAY-001',
      status: 'PAID'
    }
  });

  const claim = await prisma.claim.create({
    data: {
      policyId: policy.id,
      userId: customer.id,
      claimType: 'HEALTH',
      amount: 1500,
      incidentDate: new Date(),
      description: 'Emergency room visit',
      status: 'SUBMITTED',
      attachments: [{ filename: 'receipt.pdf', mimetype: 'application/pdf' }]
    }
  });

  await prisma.auditLog.createMany({
    data: [
      {
        actorId: underwriter.id,
        action: 'POLICY_ISSUED',
        entityType: 'Policy',
        entityId: String(policy.id),
        metadata: { policyNumber: policy.policyNumber }
      },
      {
        actorId: claimsOfficer.id,
        action: 'CLAIM_SUBMITTED',
        entityType: 'Claim',
        entityId: String(claim.id),
        metadata: { amount: claim.amount }
      },
      {
        actorId: agent.id,
        action: 'PAYMENT_RECORDED',
        entityType: 'Payment',
        entityId: String(payment.id),
        metadata: { invoiceNumber: invoice.number }
      }
    ]
  });

  console.log('Seed data created');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
