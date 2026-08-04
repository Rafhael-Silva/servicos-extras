const { sendEmail } = require('../config/mail');

const sendWelcomeEmail = async (name, email) => {
  const subject = 'Bem-vindo à nossa plataforma!';

  const text = `Olá ${name},

    Seja bem-vindo à nossa plataforma!

    Estamos felizes em ter você conosco. Qualquer dúvida, estamos à disposição.

    Atenciosamente,
    Equipe de Suporte.`;

  const html = `
    <p>Olá <strong>${name}</strong>,</p>
    <p>Seja bem-vindo à nossa plataforma! Estamos felizes em ter você conosco.</p>
    <p>Qualquer dúvida, estamos à disposição.</p>
    <br />
    <p>Atenciosamente,</p>
    <p><strong>Equipe de Suporte</strong></p>
  `;

  await sendEmail(email, subject, text, html);
};

const sendVerificationCode = async (email, code) => {
  const subject = 'Seu código de verificação';

  const text = `Seu código de verificação é: ${code}`;

  const html = `
        <p>Você está recebendo um código de verificação.</p>
        <p><strong>Código: ${code}</strong></p>
        <p>Este código expira em 10 minutos.</p>
      `;

  await sendEmail(email, subject, text, html);
};

module.exports = {
  sendWelcomeEmail,
  sendVerificationCode,
};
