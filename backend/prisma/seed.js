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
      description: 'Comprehensive health insurance',
      basePremium: 300,
      coverageLimits: { inpatient: 100000, outpatient: 20000 },
      premiumRules: { smokerMultiplier: 1.3, ageMultiplier: 1.2 },
      exclusions: ['pre-existing conditions']
    },
    {
      name: 'Life Secure',
      type: 'LIFE',
      description: 'Life cover with add-ons',
      basePremium: 250,
      coverageLimits: { term: 250000 },
      premiumRules: { smokerMultiplier: 1.25 },
      exclusions: ['self-inflicted injuries']
    },
    {
      name: 'Motor Protect',
      type: 'MOTOR',
      description: 'Vehicle insurance for personal cars',
      basePremium: 180,
      coverageLimits: { collision: 50000, theft: 20000 },
      premiumRules: { vehicleValueFactor: 0.01 },
      exclusions: ['commercial use', 'racing']
    }
  ];

  const seededProducts = [];
  for (const product of products) {
    let created = await prisma.product.findFirst({
      where: { name: product.name }
    });
    if (!created) {
      created = await prisma.product.create({
        data: product
    });
    }
    seededProducts.push(created);
  }

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
