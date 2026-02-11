const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const newProducts = [
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

async function addProducts() {
  try {
    console.log('Adding new products to database...\n');
    
    for (const product of newProducts) {
      const existing = await prisma.product.findFirst({
        where: { name: product.name }
      });
      
      if (existing) {
        console.log(`⚠️  Product "${product.name}" already exists, updating...`);
        await prisma.product.update({
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
        console.log(`✅ Updated: ${product.name}`);
      } else {
        await prisma.product.create({
          data: product
        });
        console.log(`✅ Created: ${product.name} - $${product.basePremium}/month`);
      }
    }
    
    const allProducts = await prisma.product.findMany();
    console.log(`\n🎉 Success! Total products in database: ${allProducts.length}`);
    console.log('\nProducts:');
    allProducts.forEach(p => {
      console.log(`  - ${p.name} (${p.type}) - $${p.basePremium}/month`);
    });
    
  } catch (error) {
    console.error('❌ Error adding products:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addProducts();
