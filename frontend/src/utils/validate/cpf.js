function validateCpf(cpf) {
  if (cpf.length !== 11) {
    return false;
  }

  if (/^(\d)\1+$/.test(cpf)) {
    return false;
  }

  let sum = 0;

  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }

  let remainder = sum % 11;
  if (remainder === 0 || remainder === 1) remainder = 0;
  if (remainder >= 2 && remainder <= 10) {
    remainder = 11 - remainder;
  }
  if (remainder !== parseInt(cpf.charAt(9))) return false;

  sum = 0;

  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }

  remainder = sum % 11;
  if (remainder === 0 || remainder === 1) remainder = 0;
  if (remainder >= 2 && remainder <= 10) {
    remainder = 11 - remainder;
  }
  if (remainder !== parseInt(cpf.charAt(10))) return false;

  return true;
}

export default validateCpf;
