const joi = require('joi');

const changePasswordSchema = joi.object({
  currentPassword: joi.string().required().messages({
    'any.required': 'A senha atual é obrigatória.',
    'string.empty': 'A senha atual não pode estar vazia.',
  }),
  newPassword: joi.string().min(6).required().messages({
    'any.required': 'A nova senha é obrigatória.',
    'string.empty': 'A nova senha não pode estar vazia.',
    'string.min': 'A nova senha deve ter no mínimo 6 caracteres.',
  }),
  confirmNewPassword: joi
    .any()
    .valid(joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'A confirmação da senha não coincide com a nova senha.',
      'any.required': 'A confirmação da nova senha é obrigatória.',
    }),
});

module.exports = changePasswordSchema;
