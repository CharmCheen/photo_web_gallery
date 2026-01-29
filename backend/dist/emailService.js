import nodemailer from 'nodemailer';
const fromAddress = process.env.MAIL_FROM_ADDRESS || process.env.EMAIL_FROM_ADDRESS || '';
const fromName = process.env.MAIL_FROM_NAME || process.env.EMAIL_FROM_NAME || 'Lumina';
const brandName = process.env.MAIL_BRAND_NAME || 'Lumina';
const mailHost = process.env.MAIL_HOST;
const mailPort = Number(process.env.MAIL_PORT || 587);
const mailSecure = process.env.MAIL_SECURE === 'true';
const mailUser = process.env.MAIL_USER;
const mailPass = process.env.MAIL_PASS;
const canSend = Boolean(mailHost && mailUser && mailPass && fromAddress);
const transporter = canSend
    ? nodemailer.createTransport({
        host: mailHost,
        port: mailPort,
        secure: mailSecure,
        auth: { user: mailUser, pass: mailPass },
    })
    : null;
export async function sendVerificationEmail(to, code) {
    const subject = `${brandName} verification code`;
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #111;">
      <h2 style="margin: 0 0 12px;">${brandName}</h2>
      <p style="margin: 0 0 12px;">Use this code to verify your email:</p>
      <p style="font-size: 28px; letter-spacing: 6px; font-weight: 700; margin: 12px 0 18px;">${code}</p>
      <p style="margin: 0 0 8px; color: #555;">The code expires in 5 minutes. If you did not request this, you can ignore this email.</p>
    </div>
  `;
    if (!canSend || !transporter) {
        console.log(`[EMAIL] to=${to} code=${code} (email transport not configured, logged only)`);
        return { delivered: false, simulated: true };
    }
    await transporter.sendMail({
        from: `${fromName} <${fromAddress}>`,
        to,
        subject,
        html,
    });
    return { delivered: true, simulated: false };
}
