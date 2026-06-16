const joi = require('joi');

const registerUserSchema = joi
  .object({
    name: joi.string().trim().min(2).required().messages({
      'any.required': 'O nome é obrigatório.',
      'string.empty': 'O nome não pode estar vazio.',
    }),

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
        'string.pattern.base':
          'O e-mail deve conter apenas caracteres válidos.',
      }),

    cpf: joi.alternatives().conditional('role', {
      is: 'CANDIDATO',
      then: joi
        .string()
        .trim()
        .pattern(/^[0-9]{11}$/)
        .required()
        .messages({
          'any.required': 'CPF é obrigatório para candidatos.',
          'string.empty': 'CPF não pode estar vazio para candidatos.',
          'string.pattern.base': 'O CPF deve ter exatamente 11 números.',
        }),
      otherwise: joi.string().trim().optional(),
    }),

    cnpj: joi.alternatives().conditional('role', {
      is: 'RECRUTADOR',
      then: joi
        .string()
        .trim()
        .pattern(/^[0-9]{14}$/),
      otherwise: joi.forbidden().messages({
        'any.unknown': 'CNPJ não é permitido para candidatos.',
      }),
    }),

    password: joi.string().min(6).required().messages({
      'any.required': 'A senha é obrigatória.',
      'string.empty': 'A senha não pode estar vazia.',
      'string.min': 'A senha deve ter no mínimo 6 caracteres.',
    }),

    confirmPassword: joi.any().valid(joi.ref('password')).required().messages({
      'any.only': 'As senhas não coincidem.',
      'any.required': 'A confirmação da senha é obrigatória.',
    }),

    role: joi.string().valid('RECRUTADOR', 'CANDIDATO').required().messages({
      'any.required': 'O tipo de usuário é obrigatório.',
      'any.only': 'O tipo de usuário é inválido.',
    }),

    birthDate: joi.date().less('now').required().messages({
      'any.required': 'A data de nascimento é obrigatória.',
      'date.less': 'A data de nascimento deve ser uma data no passado.',
    }),

    termsAccepted: joi.boolean().valid(true).required().messages({
      'any.required': 'Você deve aceitar os termos.',
      'any.only': 'Você deve aceitar os termos para continuar.',
    }),
  })
  .custom((value, helpers) => {
    const { role, cpf, cnpj } = value;

    if (role === 'RECRUTADOR') {
      if (cpf && cnpj) {
        return helpers.message(
          'Recrutador deve fornecer apenas CPF ou CNPJ, não ambos.',
        );
      }

      if (!cpf && !cnpj) {
        return helpers.message('Recrutador deve fornecer CPF ou CNPJ.');
      }
    }

    return value;
  });

module.exports = registerUserSchema;
