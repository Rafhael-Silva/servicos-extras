const sendEmail = require("./sendEmail");

const sendWelcomeEmail = async (name, email) => {
  if (process.env.NODE_ENV === "test") return;

  const subject = "Bem-vindo à nossa plataforma!";

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

module.exports = sendWelcomeEmail;
