const joi = require('joi');

const registerUserSchema = joi.object({
  name: joi.string().trim().min(2).required().messages({
    'any.required': 'O campo nome do usuário é obrigatório.',
    'string.empty': 'O campo nome do usuário não pode estar vazio.',
  }),

  email: joi
    .string()
    .trim()
    .pattern(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/)
    .email()
    .required()
    .messages({
      'any.required': 'O campo e-mail é obrigatório.',
      'string.email': 'O e-mail informado não é válido.',
      'string.empty': 'O campo e-mail não pode estar vazio.',
      'string.pattern.base': 'O e-mail deve conter apenas caracteres válidos.',
    }),

  accountType: joi.string().valid('PERSON', 'COMPANY').required().messages({
    'any.required': 'O campo tipo da conta é obrigatório.',
    'any.only': 'O tipo da conta é inválido.',
  }),

  cpf: joi.alternatives().conditional('accountType', {
    is: 'PERSON',
    then: joi
      .string()
      .trim()
      .custom((value) => value.replace(/\D/g, ''))
      .pattern(/^[0-9]{11}$/)
      .required()
      .messages({
        'any.required': 'O campo CPF é obrigatório.',
        'string.empty': 'O campo CPF não pode estar vazio.',
        'string.pattern.base': 'O CPF deve conter 11 números.',
      }),
    otherwise: joi.forbidden().messages({
      'any.unknown': 'CPF não é permitido para empresas.',
    }),
  }),

  cnpj: joi.alternatives().conditional('accountType', {
    is: 'COMPANY',
    then: joi
      .string()
      .trim()
      .custom((value) => value.replace(/\D/g, ''))
      .pattern(/^[0-9]{14}$/)
      .required()
      .messages({
        'any.required': 'O campo CNPJ é obrigatório.',
        'string.empty': 'O campo CNPJ não pode estar vazio.',
        'string.pattern.base': 'O CNPJ deve conter 14 números.',
      }),
    otherwise: joi.forbidden().messages({
      'any.unknown': 'CNPJ não é permitido para pessoas físicas.',
    }),
  }),

  password: joi.string().min(6).required().messages({
    'any.required': 'O campo senha é obrigatório.',
    'string.empty': 'O campo senha não pode estar vazio.',
    'string.min': 'A senha deve conter no mínimo 6 caracteres.',
  }),

  confirmPassword: joi.any().valid(joi.ref('password')).required().messages({
    'any.only': 'As senhas não coincidem.',
    'any.required': 'A confirmação da senha é obrigatória.',
  }),

  birthDate: joi.date().less('now').required().messages({
    'any.required': 'O campo de data de nascimento é obrigatório.',
    'date.less': 'A data de nascimento deve ser uma data no passado.',
  }),

  termsAccepted: joi.boolean().valid(true).required().messages({
    'any.required': 'Você deve aceitar os termos.',
    'any.only': 'Você deve aceitar os termos para continuar.',
  }),
});

module.exports = registerUserSchema;
