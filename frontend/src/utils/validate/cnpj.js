function validateCnpj(cnpj) {
  if (cnpj.length !== 14) {
    return false;
  }

  if (/^(\d)\1+$/.test(cnpj)) {
    return false;
  }

  let sum = 0;
  const weightsFirst = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  for (let i = 0; i < 12; i++) {
    sum += parseInt(cnpj.charAt(i)) * weightsFirst[i];
  }

  let remainder = sum % 11;
  if (remainder === 0 || remainder === 1) remainder = 0;
  if (remainder >= 2 && remainder <= 10) {
    remainder = 11 - remainder;
  }
  if (remainder !== parseInt(cnpj.charAt(12))) return false;

  sum = 0;
  const weightsSecond = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  for (let i = 0; i < 13; i++) {
    sum += parseInt(cnpj.charAt(i)) * weightsSecond[i];
  }

  remainder = sum % 11;
  if (remainder === 0 || remainder === 1) remainder = 0;
  if (remainder >= 2 && remainder <= 10) {
    remainder = 11 - remainder;
  }
  if (remainder !== parseInt(cnpj.charAt(13))) return false;

  return true;
}

export default validateCnpj;
