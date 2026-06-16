const joi = require('joi');
const { VerificationType } = require('@prisma/client');

const verifyUserCodeSchema = joi.object({
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
  code: joi
    .string()
    .length(6)
    .trim()
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      'string.length': 'O código deve conter 6 dígitos.',
      'string.pattern.base': 'O código deve conter apenas números.',
      'any.required': 'Código de verificação é obrigatório.',
      'string.empty': 'O código não pode estar vazio.',
    }),
  type: joi
    .string()
    .trim()
    .valid(...Object.values(VerificationType))
    .required()
    .messages({
      'any.required': 'Tipo de verificação é obrigatório.',
      'any.only': 'O tipo informado é inválido.',
    }),
});

module.exports = verifyUserCodeSchema;
