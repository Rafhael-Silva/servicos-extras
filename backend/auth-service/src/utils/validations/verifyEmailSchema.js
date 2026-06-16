const joi = require('joi');

const verifyEmailSchema = joi.object({
  verificationToken: joi.string().required().messages({
    'any.required': 'Token é obrigatório.',
  }),
});

module.exports = verifyEmailSchema;
