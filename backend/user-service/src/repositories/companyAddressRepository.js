const prisma = require('../config/prisma');

const create = (dataAddress) => {
  return prisma.companyAddress.create({
    data: dataAddress,
    select: {
      companyId: true,
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
  return prisma.companyAddress.update({
    where: { companyId: authUserId },
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
