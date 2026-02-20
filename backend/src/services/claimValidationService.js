// Plan definitions with coverage limits based on premium
const PLAN_COVERAGE_LIMITS = {
  HEALTH: {
    BASIC: { premium: 1200, inpatient: 50000, outpatient: 10000, annualLimit: 50000 },
    STANDARD: { premium: 2400, inpatient: 100000, outpatient: 20000, annualLimit: 100000 },
    PREMIUM: { premium: 3600, inpatient: 200000, outpatient: 40000, annualLimit: 200000 },
    ULTRA_PREMIUM: { premium: 6000, inpatient: null, outpatient: null, annualLimit: null }, // Unlimited
  },
  MOTOR: {
    BASIC: { premium: 800, collision: 20000, theft: 10000, liability: 50000 },
    STANDARD: { premium: 1500, collision: 50000, theft: 25000, liability: 100000 },
    PREMIUM: { premium: 2500, collision: 100000, theft: 50000, liability: 200000 },
    ULTRA_PREMIUM: { premium: 4000, collision: null, theft: null, liability: null }, // Unlimited
  },
  LIFE: {
    BASIC: { premium: 1500, deathBenefit: 100000, criticalIllness: 50000 },
    STANDARD: { premium: 3000, deathBenefit: 250000, criticalIllness: 100000 },
    PREMIUM: { premium: 5000, deathBenefit: 500000, criticalIllness: 200000 },
    ULTRA_PREMIUM: { premium: 10000, deathBenefit: null, criticalIllness: null }, // Unlimited
  },
  TRAVEL: {
    BASIC: { premium: 50, medical: 50000, tripCancellation: 2000, baggage: 1000 },
    STANDARD: { premium: 100, medical: 100000, tripCancellation: 5000, baggage: 2000 },
    PREMIUM: { premium: 200, medical: 200000, tripCancellation: 10000, baggage: 5000 },
    ULTRA_PREMIUM: { premium: 400, medical: 500000, tripCancellation: 20000, baggage: 10000 },
  },
  FIRE: {
    BASIC: { premium: 600, building: 200000, contents: 50000, temporaryAccommodation: 20000 },
    STANDARD: { premium: 1200, building: 500000, contents: 100000, temporaryAccommodation: 50000 },
    PREMIUM: { premium: 2000, building: 1000000, contents: 200000, temporaryAccommodation: 100000 },
    ULTRA_PREMIUM: { premium: 3500, building: null, contents: null, temporaryAccommodation: null }, // Unlimited
  },
  PROPERTY: {
    BASIC: { premium: 800, building: 300000, contents: 75000, liability: 200000 },
    STANDARD: { premium: 1500, building: 600000, contents: 150000, liability: 400000 },
    PREMIUM: { premium: 2500, building: 1200000, contents: 300000, liability: 800000 },
    ULTRA_PREMIUM: { premium: 4000, building: null, contents: null, liability: null }, // Unlimited
  },
  HOME: {
    BASIC: { premium: 1000, dwelling: 300000, personalProperty: 100000, liability: 200000 },
    STANDARD: { premium: 2000, dwelling: 600000, personalProperty: 200000, liability: 400000 },
    PREMIUM: { premium: 3500, dwelling: 1200000, personalProperty: 400000, liability: 800000 },
    ULTRA_PREMIUM: { premium: 6000, dwelling: null, personalProperty: null, liability: null }, // Unlimited
  },
  BUSINESS: {
    BASIC: { premium: 1200, property: 500000, liability: 1000000, businessInterruption: 200000 },
    STANDARD: { premium: 2500, property: 1000000, liability: 2000000, businessInterruption: 500000 },
    PREMIUM: { premium: 5000, property: 2000000, liability: 5000000, businessInterruption: 1000000 },
    ULTRA_PREMIUM: { premium: 10000, property: null, liability: null, businessInterruption: null }, // Unlimited
  },
  LIABILITY: {
    BASIC: { premium: 1500, generalLiability: 1000000, productLiability: 500000, personalInjury: 250000 },
    STANDARD: { premium: 3000, generalLiability: 2000000, productLiability: 1000000, personalInjury: 500000 },
    PREMIUM: { premium: 6000, generalLiability: 5000000, productLiability: 2000000, personalInjury: 1000000 },
    ULTRA_PREMIUM: { premium: 12000, generalLiability: null, productLiability: null, personalInjury: null }, // Unlimited
  },
};

// Determine plan based on premium
function determinePlan(productType, premium) {
  const plans = PLAN_COVERAGE_LIMITS[productType];
  if (!plans) return null;

  // Find the plan that matches the premium (with tolerance for rounding)
  const tolerance = 50; // Allow $50 tolerance for premium matching
  for (const [planName, planData] of Object.entries(plans)) {
    if (Math.abs(premium - planData.premium) <= tolerance) {
      return { name: planName, limits: planData };
    }
  }

  // If no exact match, find the closest plan
  let closestPlan = null;
  let minDiff = Infinity;
  for (const [planName, planData] of Object.entries(plans)) {
    const diff = Math.abs(premium - planData.premium);
    if (diff < minDiff) {
      minDiff = diff;
      closestPlan = { name: planName, limits: planData };
    }
  }

  return closestPlan;
}

// Get coverage limit for a specific claim type
function getCoverageLimit(plan, productType, claimType) {
  if (!plan || !plan.limits) return null;

  const limits = plan.limits;

  // Health insurance limits
  if (productType === 'HEALTH' && claimType === 'HEALTH') {
    // For health, check annual limit or inpatient limit
    if (limits.annualLimit !== null && limits.annualLimit !== undefined) {
      return limits.annualLimit;
    }
    if (limits.inpatient !== null && limits.inpatient !== undefined) {
      return limits.inpatient;
    }
    return null; // Unlimited
  }

  // Motor insurance limits
  if (productType === 'MOTOR' && claimType === 'MOTOR') {
    // Use the highest limit available (collision, theft, or liability)
    const motorLimits = [limits.collision, limits.theft, limits.liability].filter(l => l !== null && l !== undefined);
    if (motorLimits.length > 0) {
      return Math.max(...motorLimits);
    }
    return null; // Unlimited
  }

  // Life insurance limits
  if (productType === 'LIFE' && claimType === 'LIFE') {
    return limits.deathBenefit || limits.criticalIllness || null;
  }

  // Travel insurance limits
  if (productType === 'TRAVEL' && claimType === 'TRAVEL') {
    return limits.medical || limits.tripCancellation || limits.baggage || null;
  }

  // Fire insurance limits
  if (productType === 'FIRE' && claimType === 'FIRE') {
    const fireLimits = [limits.building, limits.contents, limits.temporaryAccommodation].filter(l => l !== null && l !== undefined);
    if (fireLimits.length > 0) {
      return Math.max(...fireLimits);
    }
    return null; // Unlimited
  }

  // Property insurance limits
  if (productType === 'PROPERTY' && claimType === 'PROPERTY') {
    const propertyLimits = [limits.building, limits.contents, limits.liability].filter(l => l !== null && l !== undefined);
    if (propertyLimits.length > 0) {
      return Math.max(...propertyLimits);
    }
    return null; // Unlimited
  }

  // Home insurance limits
  if (productType === 'HOME' && claimType === 'HOME') {
    const homeLimits = [limits.dwelling, limits.personalProperty, limits.liability].filter(l => l !== null && l !== undefined);
    if (homeLimits.length > 0) {
      return Math.max(...homeLimits);
    }
    return null; // Unlimited
  }

  // Business insurance limits
  if (productType === 'BUSINESS' && claimType === 'BUSINESS') {
    const businessLimits = [limits.property, limits.liability, limits.businessInterruption].filter(l => l !== null && l !== undefined);
    if (businessLimits.length > 0) {
      return Math.max(...businessLimits);
    }
    return null; // Unlimited
  }

  // Liability insurance limits
  if (productType === 'LIABILITY' && claimType === 'LIABILITY') {
    const liabilityLimits = [limits.generalLiability, limits.productLiability, limits.personalInjury].filter(l => l !== null && l !== undefined);
    if (liabilityLimits.length > 0) {
      return Math.max(...liabilityLimits);
    }
    return null; // Unlimited
  }

  return null;
}

function validateClaim(policy, product, claimPayload) {
  const { incidentDate, claimType, amount } = claimPayload;
  const errors = [];

  // Check policy status
  if (policy.status !== 'ACTIVE') {
    errors.push(`Policy is not active. Current status: ${policy.status}. Only ACTIVE policies can have claims submitted.`);
  }

  // Check incident date is within policy period
  const incident = new Date(incidentDate);
  const policyStart = new Date(policy.startDate);
  const policyEnd = new Date(policy.endDate);
  
  if (isNaN(incident.getTime())) {
    errors.push('Invalid incident date format');
  } else {
    if (incident < policyStart) {
      errors.push(`Incident date (${incidentDate}) is before policy start date (${policyStart.toISOString().split('T')[0]}). The incident must occur during the policy period.`);
    }
    if (incident > policyEnd) {
      errors.push(`Incident date (${incidentDate}) is after policy end date (${policyEnd.toISOString().split('T')[0]}). The incident must occur during the policy period.`);
  }
  }

  // Check claim type matches product type
  if (claimType !== product.type) {
    errors.push(`Claim type "${claimType}" does not match policy product type "${product.type}". Please select "${product.type}" as the claim type.`);
  }

  // Check for product exclusions
  if (Array.isArray(product.exclusions) && product.exclusions.length > 0) {
    const matchesExclusion = product.exclusions.some((item) =>
      claimPayload.description?.toLowerCase().includes(String(item).toLowerCase())
    );
    if (matchesExclusion) {
      errors.push(`Claim description triggers product exclusion. Please review the policy exclusions: ${product.exclusions.join(', ')}`);
    }
  }

  // Validate claim amount
  if (amount <= 0) {
    errors.push('Claim amount must be greater than 0');
  } else {
    // Determine plan based on premium
    const plan = determinePlan(product.type, policy.premium);
    
    if (plan) {
      // Get coverage limit for this plan and claim type
      const coverageLimit = getCoverageLimit(plan, product.type, claimType);
      
      if (coverageLimit === null) {
        // Unlimited coverage - no limit check needed
        // But we can still validate it's reasonable (e.g., not more than 10x premium)
        const maxReasonableAmount = policy.premium * 10;
        if (amount > maxReasonableAmount) {
          errors.push(`Claim amount ($${amount.toLocaleString()}) seems unusually high for a ${plan.name} plan with premium $${policy.premium.toLocaleString()}. Please verify the amount.`);
        }
      } else if (amount > coverageLimit) {
        // Claim exceeds coverage limit
        const planName = plan.name.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
        errors.push(
          `Claim amount ($${amount.toLocaleString()}) exceeds the coverage limit of $${coverageLimit.toLocaleString()} for your ${planName} plan (premium: $${policy.premium.toLocaleString()}/year). ` +
          `The maximum claimable amount for this plan is $${coverageLimit.toLocaleString()}.`
        );
      }
    } else {
      // Fallback: If plan cannot be determined, use old validation (5x premium)
      const maxAmount = policy.premium * 5;
      if (amount > maxAmount) {
        errors.push(`Claim amount ($${amount.toLocaleString()}) exceeds the maximum limit of $${maxAmount.toLocaleString()} (5x the policy premium of $${policy.premium.toLocaleString()}).`);
      }
    }
  }

  return errors;
}

module.exports = { 
  validateClaim,
  determinePlan,
  getCoverageLimit,
  PLAN_COVERAGE_LIMITS
};
