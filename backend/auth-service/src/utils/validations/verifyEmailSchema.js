const joi = require('joi');

const verifyEmailSchema = joi.object({
  verificationToken: joi.string().required().messages({
    'any.required': 'O token de verificação é obrigatório.',
  }),
});

module.exports = verifyEmailSchema;
