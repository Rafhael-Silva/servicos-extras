const AppError = require('../../errors/AppError');

const isUserUnderage = (birthDate) => {
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) throw new AppError('Data inválida.', 400);
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  const dayDiff = today.getDate() - birth.getDate();
  return (
    age < 18 ||
    (age === 18 && (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)))
  );
};

const calculateAge = (birthDate) => {
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) throw new AppError('Data inválida.', 400);
  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();

  const monthDiff = today.getMonth() - birth.getMonth();
  const dayDiff = today.getDate() - birth.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age--;
  }

  return age;
};

module.exports = {
  isUserUnderage,
  calculateAge,
};
