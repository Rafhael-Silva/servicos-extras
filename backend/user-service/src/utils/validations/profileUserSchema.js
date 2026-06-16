const joi = require('joi');

const profileUserSchema = joi.object({
  phone: joi
    .string()
    .trim()
    .pattern(/^\d{11}$/)
    .required()
    .messages({
      'any.required': 'O telefone é obrigatório.',
      'string.empty': 'O telefone não pode estar vazio.',
    }),
  pixKey: joi.string().trim().max(100).required().messages({
    'any.required': 'A chave Pix é obrigatória.',
    'string.empty': 'A chave Pix não pode estar vazia.',
  }),
  bio: joi.string().max(500).optional(),
  city: joi.string().max(100).required().messages({
    'any.required': 'A cidade é obrigatória.',
    'string.empty': 'A cidade não pode estar vazia',
  }),
  state: joi.string().length(2).uppercase().required().messages({
    'any.required': 'O estado é obrigatória.',
    'string.empty': 'O estado não pode estar vazia',
  }),
});

module.exports = profileUserSchema;
