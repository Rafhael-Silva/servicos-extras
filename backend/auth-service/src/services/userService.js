const { userRepository } = require('../repositories');
const AppError = require('../../errors/AppError');
const { AccountType } = require('@prisma/client');
const { normalizeEmail } = require('../utils');

const emailExists = (email) => {
  if (!email) {
    throw new AppError('Dados inválidos.', 400);
  }
  const normalizedEmail = normalizeEmail(email);
  return userRepository.findByEmail(normalizedEmail);
};

const cpfExists = (cpf) => {
  if (!cpf) {
    throw new AppError('Dados inválidos.', 400);
  }
  return userRepository.findByCpf(cpf);
};

const cnpjExists = (cnpj) => {
  if (!cnpj) {
    throw new AppError('Dados inválidos.', 400);
  }
  return userRepository.findByCnpj(cnpj);
};

const createUser = ({
  name,
  email,
  passwordHash,
  accountType,
  cpf,
  cnpj,
  termsAccepted,
  birthDate,
}) => {
  const parsedAccountType = String(accountType).toUpperCase();

  if (!Object.values(AccountType).includes(parsedAccountType)) {
    throw new AppError('Tipo de usuário inválido.', 400);
  }

  const newUserData = {
    name,
    email: normalizeEmail(email),
    passwordHash,
    accountType: parsedAccountType,
    cpf,
    cnpj,
    termsAccepted,
    birthDate: new Date(birthDate),
  };

  const newUser = userRepository.createUser(newUserData);

  return newUser;
};

module.exports = {
  emailExists,
  cpfExists,
  cnpjExists,
  createUser,
};
