const dotenv = require('dotenv');
dotenv.config({
  path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
});

const app = require('./app');
const startCleanupJobs = require('./job/startCleanupJobs');
const logger = require('./config/logger');

const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(PORT, () => {
    logger.info(`Auth Service rodando na porta ${PORT}`);
    startCleanupJobs();
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
