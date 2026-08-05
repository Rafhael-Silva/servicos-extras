const joi = require('joi');

const curriculumUserSchema = joi.object({
  professionalSummary: joi.string().trim().max(1000),
  experiences: joi.array().items(
    joi.object({
      company: joi.string().trim(),
      role: joi.string().trim(),
      startDate: joi.string().trim(),
      endDate: joi.string().trim(),
      description: joi.string().trim().max(2000),
    }),
  ),
  educations: joi.array().items(
    joi.object({
      institution: joi.string().trim(),
      course: joi.string().trim(),
      completionYear: joi.number().integer().min(1900).max(2100),
    }),
  ),
  courses: joi.array().items(
    joi.object({
      name: joi.string().trim(),
      workLoad: joi.string().trim(),
    }),
  ),
  skills: joi.array().items(joi.string().trim().max(100)),
  observations: joi.string().trim().max(1000),
});

module.exports = curriculumUserSchema;
