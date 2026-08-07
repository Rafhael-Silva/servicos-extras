const prisma = require('../config/prisma');

const create = (dataAddress) => {
  return prisma.personAddress.create({
    data: dataAddress,
    select: {
      personId: true,
      street: true,
      number: true,
      complement: true,
      neighborhood: true,
      city: true,
      state: true,
      zipCode: true,
    },
  });
};

const update = (authUserId, dataAddress) => {
  return prisma.personAddress.update({
    where: { personId: authUserId },
    data: dataAddress,
    select: {
      street: true,
      number: true,
      complement: true,
      neighborhood: true,
      city: true,
      state: true,
      zipCode: true,
    },
  });
};

module.exports = {
  create,
  update,
};
