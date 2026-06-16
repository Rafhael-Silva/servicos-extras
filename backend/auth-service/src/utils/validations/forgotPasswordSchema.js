const joi = require('joi');

const forgotPasswordSchema = joi.object({
  email: joi.string().email().required().messages({
    'any.required': 'O e-mail é obrigatório.',
    'string.email': 'O e-mail informado não é válido.',
    'string.empty': 'O e-mail não pode estar vazio.',
  }),
});

module.exports = forgotPasswordSchema;
