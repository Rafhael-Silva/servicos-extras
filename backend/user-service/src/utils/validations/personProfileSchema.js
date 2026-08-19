const joi = require('joi');

const personProfileSchema = joi.object({
  profileData: joi
    .object({
      phone: joi
        .string()
        .trim()
        .pattern(/^\d{11}$/)
        .required()
        .messages({
          'any.required': 'O campo telefone é obrigatório.',
          'string.empty': 'O campo telefone não pode estar vazio.',
          'string.pattern.base': 'O campo telefone deve conter 11 dígitos.',
        }),
      bio: joi.string().max(500).optional(),
    })
    .required(),
  addressData: joi
    .object({
      street: joi.string().max(255).required().messages({
        'any.required': 'O campo rua é obrigatório.',
        'string.empty': 'O campo rua não pode estar vazio.',
      }),
      number: joi.string().max(20).required().messages({
        'any.required': 'O campo número é obrigatório.',
        'string.empty': 'O campo número não pode estar vazio.',
      }),
      complement: joi.string().max(100).optional(),
      neighborhood: joi.string().max(100).required().messages({
        'any.required': 'O campo bairro é obrigatório.',
        'string.empty': 'O campo bairro não pode estar vazio.',
      }),
      city: joi.string().max(100).required().messages({
        'any.required': 'O campo cidade é obrigatório.',
        'string.empty': 'O campo cidade não pode estar vazio.',
      }),
      state: joi.string().length(2).uppercase().required().messages({
        'any.required': 'O campo estado é obrigatório.',
        'string.empty': 'O campo estado não pode estar vazio.',
        'string.length': 'O campo estado deve conter 2 caracteres.',
      }),
      zipCode: joi
        .string()
        .pattern(/^\d{8}$/)
        .required()
        .messages({
          'any.required': 'O campo CEP é obrigatório.',
          'string.empty': 'O campo CEP não pode estar vazio.',
          'string.pattern.base': 'O campo CEP deve conter 8 dígitos.',
        }),
    })
    .required(),
});

module.exports = personProfileSchema;
