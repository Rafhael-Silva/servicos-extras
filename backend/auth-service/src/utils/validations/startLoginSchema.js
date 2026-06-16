const joi = require('joi');

const startLoginSchema = joi.object({
  email: joi
    .string()
    .trim()
    .pattern(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/)
    .email()
    .required()
    .messages({
      'any.required': 'O e-mail é obrigatório.',
      'string.email': 'O e-mail informado não é válido.',
      'string.empty': 'O e-mail não pode estar vazio.',
      'string.pattern.base': 'O e-mail deve conter apenas caracteres válidos.',
    }),

  password: joi.string().min(6).required().messages({
    'any.required': 'A senha é obrigatória.',
    'string.empty': 'A senha não pode estar vazia.',
    'string.min': 'A senha deve ter no mínimo 6 caracteres.',
  }),
});

module.exports = startLoginSchema;
