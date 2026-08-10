const joi = require('joi');

const changePasswordSchema = joi.object({
  currentPassword: joi.string().required().messages({
    'any.required': 'O campo da senha atual é obrigatório.',
    'string.empty': 'O campo da senha atual não pode estar vazio.',
  }),
  newPassword: joi.string().min(6).required().messages({
    'any.required': 'O campo da nova senha é obrigatório.',
    'string.empty': 'O campo da nova senha não pode estar vazio.',
    'string.min': 'O campo da nova senha deve ter no mínimo 6 caracteres.',
  }),
  confirmNewPassword: joi
    .any()
    .valid(joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'A confirmação da senha não coincide com a nova senha.',
      'any.required': 'O campo de confirmação da nova senha é obrigatório.',
    }),
});

module.exports = changePasswordSchema;
