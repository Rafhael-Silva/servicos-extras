const { createLogger, format, transports } = require('winston');

const createAppLogger = (serviceName) => {
  return createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: format.combine(
      format.errors({ stack: true }),
      format.timestamp(),
      format.json(),
    ),
    defaultMeta: { service: serviceName },
    transports: [
      new transports.Console({
        format: format.combine(
          format.colorize(),
          format.timestamp(),
          format.printf(({ timestamp, level, message, service, stack }) => {
            return stack
              ? `[${timestamp}] [${service}] ${level}: ${message}\n${stack}`
              : `[${timestamp}] [${service}] ${level}: ${message}`;
          }),
        ),
      }),
      new transports.File({ filename: 'logs/error.log', level: 'error' }),
      new transports.File({ filename: 'logs/combined.log' }),
    ],
  });
};

const logger = createAppLogger('auth-service');

module.exports = logger;
