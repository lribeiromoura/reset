import nodemailer from "nodemailer";

type AuthEmail = {
  to: string;
  subject: string;
  text: string;
  link: string;
};

export async function sendAuthEmail({ to, subject, text, link }: AuthEmail) {
  const smtpUrl = process.env.SMTP_URL;
  const from = process.env.EMAIL_FROM;

  if (!smtpUrl || !from) {
    throw new Error("Configure SMTP_URL e EMAIL_FROM para habilitar os e-mails de autenticação.");
  }

  const transport = nodemailer.createTransport(smtpUrl);
  const safeLink = link.replaceAll("&", "&amp;").replaceAll("\"", "&quot;").replaceAll("'", "&#39;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  const safeText = text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  await transport.sendMail({
    from,
    to,
    subject,
    text,
    html: `<div style="font-family:Arial,sans-serif;color:#1d342a;line-height:1.6"><p>${safeText}</p><p><a href="${safeLink}" style="color:#287355">Continuar no Reset</a></p><p style="font-size:12px;color:#718076">Se você não pediu esta mensagem, pode ignorá-la.</p></div>`,
  });
}
