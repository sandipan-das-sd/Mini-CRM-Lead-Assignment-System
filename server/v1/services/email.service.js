const nodemailer = require('nodemailer');
const env = require('../config/env');
const { renderTemplate } = require('../email/templates');

let transporter;

function getTransporter() {
  if (transporter) return transporter;
  transporter = env.SMTP_HOST
    ? nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_SECURE,
        auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined,
      })
    : nodemailer.createTransport({ jsonTransport: true });
  return transporter;
}

async function sendTemplateEmail({ to, template, data }) {
  const rendered = renderTemplate(template, data);
  const info = await getTransporter().sendMail({
    from: env.MAIL_FROM,
    to,
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html,
  });
  if (!env.SMTP_HOST) 
    console.log('Development email generated:', info.message);
  return info;
}

module.exports = { sendTemplateEmail };
