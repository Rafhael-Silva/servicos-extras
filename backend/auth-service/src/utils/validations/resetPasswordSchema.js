const joi = require('joi');

const resetPasswordSchema = joi.object({
  verificationToken: joi.string().required().messages({
    'any.required': 'Token de redefinição é obrigatório.',
  }),
  newPassword: joi.string().min(6).required().messages({
    'string.min': 'A nova senha deve ter no mínimo 6 caracteres.',
    'any.required': 'A nova senha é obrigatória.',
  }),
  confirmNewPassword: joi
    .any()
    .valid(joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'A confirmação da senha não corresponde à nova senha.',
      'any.required': 'A confirmação da nova senha é obrigatória.',
    }),
});

module.exports = resetPasswordSchema;
