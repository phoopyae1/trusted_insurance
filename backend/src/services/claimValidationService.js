function validateClaim(policy, product, claimPayload) {
  const { incidentDate, claimType, amount } = claimPayload;
  const errors = [];

  const incident = new Date(incidentDate);
  if (!(incident >= new Date(policy.startDate) && incident <= new Date(policy.endDate))) {
    errors.push('Incident date must be within policy period');
  }

  if (claimType !== product.type) {
    errors.push('Claim type not covered by policy product');
  }

  if (Array.isArray(product.exclusions)) {
    const matchesExclusion = product.exclusions.some((item) =>
      claimPayload.description?.toLowerCase().includes(String(item).toLowerCase())
    );
    if (matchesExclusion) errors.push('Claim triggers product exclusion');
  }

  const maxAmount = policy.premium * 5;
  if (amount > maxAmount) {
    errors.push(`Claim amount exceeds limit of ${maxAmount}`);
  }

  if (policy.status !== 'ACTIVE') {
    errors.push('Policy is not active');
  }

  return errors;
}

module.exports = { validateClaim };
