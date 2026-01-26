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

  // Check claim amount limit
  const maxAmount = policy.premium * 5;
  if (amount > maxAmount) {
    errors.push(`Claim amount ($${amount}) exceeds the maximum limit of $${maxAmount.toFixed(2)} (5x the policy premium of $${policy.premium.toFixed(2)}).`);
  }

  if (amount <= 0) {
    errors.push('Claim amount must be greater than 0');
  }

  return errors;
}

module.exports = { validateClaim };
