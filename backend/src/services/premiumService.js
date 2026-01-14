function calculatePremium(basePremium, metadata = {}) {
  let premium = basePremium;
  if (metadata.age && metadata.age > 50) premium *= 1.2;
  if (metadata.smoker) premium *= 1.3;
  if (metadata.vehicleValue) premium += metadata.vehicleValue * 0.01;
  if (metadata.tripDuration) premium += metadata.tripDuration * 2;
  return Number(premium.toFixed(2));
}

module.exports = { calculatePremium };
