const validateSchema = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map((detail) => detail.message);
      return res.status(400).json({
        type: 'ValidationError',
        message: 'Erro de validação nos dados enviados.',
        errors: messages,
      });
    }

    req.body = value;
    next();
  };
};

module.exports = validateSchema;
