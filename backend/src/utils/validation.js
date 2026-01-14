function validateRequired(body, fields) {
  const missing = fields.filter(field => !body[field]);
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
}

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) {
    throw new Error('Invalid email format');
  }
}

function validateNumber(value, fieldName) {
  const num = Number(value);
  if (isNaN(num)) {
    throw new Error(`${fieldName} must be a number`);
  }
  return num;
}

module.exports = {
  validateRequired,
  validateEmail,
  validateNumber
};
