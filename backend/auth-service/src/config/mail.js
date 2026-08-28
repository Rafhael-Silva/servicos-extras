const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport(
  process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'integration'
    ? {
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT),
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      }
    : {
        service: 'Gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      },
);
const sendEmail = (to, subject, text, html) => {
  return transporter.sendMail({
    from: `'Seu site' <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });
};

module.exports = sendEmail;
