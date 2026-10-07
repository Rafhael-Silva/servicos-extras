function normalizeCnpj(cnpj) {
  return cnpj.replace(/\D/g, '');
}

export default normalizeCnpj;
