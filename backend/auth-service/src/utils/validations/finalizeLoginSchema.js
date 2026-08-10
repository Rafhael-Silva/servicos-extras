const joi = require('joi');

const finalizeLoginSchema = joi.object({
  verificationToken: joi.string().required().messages({
    'any.required': 'O token é obrigatório.',
  }),
});

module.exports = finalizeLoginSchema;
