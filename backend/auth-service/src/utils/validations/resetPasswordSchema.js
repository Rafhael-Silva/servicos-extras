const joi = require('joi');

const resetPasswordSchema = joi.object({
  verificationToken: joi.string().required().messages({
    'any.required': 'O token de redefinição de senha é obrigatório.',
  }),
  newPassword: joi.string().min(6).required().messages({
    'string.min': 'A nova senha deve conter no mínimo 6 caracteres.',
    'any.required': 'O campo da nova senha é obrigatório.',
  }),
  confirmNewPassword: joi
    .any()
    .valid(joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'A confirmação da senha não corresponde à nova senha.',
      'any.required': 'O campo de confirmação da nova senha é obrigatório.',
    }),
});

module.exports = resetPasswordSchema;
