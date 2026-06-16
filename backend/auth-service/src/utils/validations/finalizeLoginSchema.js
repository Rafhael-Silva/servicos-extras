const joi = require('joi');

const finalizeLoginSchema = joi.object({
  verificationToken: joi.string().required().messages({
    'any.required': 'Token é obrigatório.',
  }),
});

module.exports = finalizeLoginSchema;
