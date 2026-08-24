const joi = require('joi');

const curriculumPersonSchema = joi.object({
  professionalSummary: joi.string().trim().required().max(1000).messages({
    'any.required': 'O campo Resumo Profissional é obrigatório.',
    'string.empty': 'O campo Resumo Profissional não pode estar vazio.',
    'string.max':
      'O campo Resumo Profissional não pode conter mais de 1000 caracteres.',
  }),
  experiences: joi
    .array()
    .items(
      joi.object({
        company: joi
          .string()
          .trim()
          .required()
          .messages({ 'any.required': 'O campo empresa é obrigatório.' }),
        role: joi
          .string()
          .trim()
          .required()
          .messages({ 'any.required': 'O campo cargo é obrigatório.' }),
        startDate: joi
          .string()
          .pattern(/^(0[1-9]|1[0-2])\/\d{4}$/)
          .required()
          .messages({
            'any.required': 'O campo data de início é obrigatório.',
            'string.pattern.base': 'A data deve estar no formato MM/AAAA.',
          }),
        endDate: joi
          .string()
          .pattern(/^(0[1-9]|1[0-2])\/\d{4}$/)
          .optional()
          .allow(null),
        description: joi
          .string()
          .trim()
          .max(2000)
          .optional()
          .allow(null)
          .messages({
            'string.pattern.base': 'A data deve estar no formato MM/AAAA.',
          }),
      }),
    )
    .optional()
    .allow(null),
  educations: joi
    .array()
    .items(
      joi.object({
        institution: joi
          .string()
          .trim()
          .required()
          .messages({ 'any.required': 'O campo instituição é obrigatório.' }),
        course: joi
          .string()
          .trim()
          .required()
          .messages({ 'any.required': 'O campo curso é obrigatório.' }),
        completionYear: joi
          .number()
          .integer()
          .min(1900)
          .max(2100)
          .required()
          .messages({
            'any.required': 'O campo ano de conclusão é obrigatório.',
          }),
      }),
    )
    .optional()
    .allow(null),
  courses: joi
    .array()
    .items(
      joi.object({
        name: joi
          .string()
          .trim()
          .required()
          .messages({ 'any.required': 'O campo nome do curso é obrigatório.' }),
        workLoad: joi.string().trim().required().messages({
          'any.required': 'O campo carga horária é obrigatório.',
        }),
      }),
    )
    .optional()
    .allow(null),
  skills: joi
    .array()
    .min(1)
    .required()
    .items(joi.string().trim().required().max(100))
    .messages({
      'any.required': 'O campo Habilidades é obrigatório.',
      'array.min': 'O campo Habilidades deve conter ao menos uma habilidade.',
    }),
  observations: joi.string().trim().max(1000).optional().allow(null),
});

module.exports = curriculumPersonSchema;
