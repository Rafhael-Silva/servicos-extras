const normalizeCpf = (cpf) => {
  return cpf.replace(/\D/g, '');
};

export default normalizeCpf;
