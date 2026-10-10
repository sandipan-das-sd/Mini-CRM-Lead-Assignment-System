function normalizeEmail(value) {
  if (value === undefined || value === null || value === '')
     return null;
  return value.trim().toLowerCase();
}

function normalizePhone(value) {
  if (value === undefined || value === null || value === '') 
    return null;
  const input = String(value).trim();
  const hasInternationalPrefix = input.startsWith('+');
  const digits = input.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15)
     return null;
  return `${hasInternationalPrefix ? '+' : ''}${digits}`;
}

module.exports = { normalizeEmail, normalizePhone };
