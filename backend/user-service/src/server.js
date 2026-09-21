const dotenv = require('dotenv');
dotenv.config({
  path:
    process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'integration'
      ? '.env.test'
      : '.env',
});

const app = require('./app');
const logger = require('./config/logger');

const PORT = process.env.PORT || 3002;

if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(PORT, () => {
    logger.info(`User service rodando na porta ${PORT}`);
  });

  server.on('error', (error) => {
    logger.error('Erro ao iniciar aplicação', { error: error.message });

    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection:', { reason });

    process.exit(1);
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', { error: error.message });

    process.exit(1);
  });
}
