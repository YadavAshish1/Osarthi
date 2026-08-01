import { Resend } from 'resend';

let resendClient = null;

function getResendClient() {
  if (!resendClient && process.env.RESEND_API_KEY) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

export async function sendOtpEmail(toEmail, otp, name) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || 'Medhashine <onboarding@resend.dev>';

  // Dev fallback log if API Key isn't configured yet
  console.log(`[OTP Verification] Code for ${toEmail}: ${otp}`);

  if (!apiKey) {
    console.warn('[Resend] RESEND_API_KEY is not set in process.env. OTP was logged to server console above.');
    return { success: true, devMode: true };
  }

  const client = getResendClient();

  const html = `
    <div font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #E5E1D8; border-radius: 12px; background-color: #FAF8F5;">
      <h2 style="color: #1A1A1A; font-size: 24px; margin-bottom: 8px;">Verify Your Email</h2>
      <p style="color: #5C5A55; font-size: 15px; line-height: 1.5;">Hi ${name || 'there'},</p>
      <p style="color: #5C5A55; font-size: 15px; line-height: 1.5;">Welcome to <strong>Medhashine</strong>! Use the verification code below to complete your registration:</p>
      <div style="background-color: #ffffff; border: 1px solid #E5E1D8; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #A84C32;">${otp}</span>
      </div>
      <p style="color: #5C5A55; font-size: 13px; line-height: 1.5;">This code will expire in 10 minutes. If you did not request this code, please ignore this email.</p>
    </div>
  `;

  try {
    const { data, error } = await client.emails.send({
      from: fromEmail,
      to: [toEmail],
      subject: `${otp} is your Medhashine verification code`,
      html,
    });

    if (error) {
      console.error('[Resend Error]', error);
      throw new Error(error.message || 'Failed to send OTP email via Resend');
    }

    return { success: true, data };
  } catch (err) {
    console.error('[sendOtpEmail Exception]', err);
    throw err;
  }
}

export async function sendContactEmail({ name, email, message, isTeacher }) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || 'Medhashine <onboarding@resend.dev>';
  const toEmail = process.env.ADMIN_EMAIL || process.env.CONTACT_EMAIL;

  console.log(`[Contact Form Submission]\nFrom: ${name} <${email}>\nTeacher: ${isTeacher ? 'Yes' : 'No'}\nMessage: ${message}`);

  if (!apiKey) {
    console.warn('[Resend] RESEND_API_KEY is not set in process.env. Message logged to server console above.');
    return { success: true, devMode: true };
  }

  const recipient = toEmail || 'delivered@resend.dev';
  const client = getResendClient();

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #E5E1D8; border-radius: 12px; background-color: #FAF8F5;">
      <div style="background-color: #A84C32; color: #ffffff; padding: 12px 20px; border-radius: 8px 8px 0 0; font-size: 14px; font-weight: bold; tracking: 1px;">
        NEW CONTACT MESSAGE — MEDHASHINE
      </div>
      <div style="padding: 20px; background-color: #ffffff; border: 1px solid #E5E1D8; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="margin: 0 0 12px 0; font-size: 15px; color: #1A1A1A;"><strong>Sender:</strong> ${name}</p>
        <p style="margin: 0 0 12px 0; font-size: 15px; color: #1A1A1A;"><strong>Email:</strong> <a href="mailto:${email}" style="color: #A84C32;">${email}</a></p>
        <p style="margin: 0 0 16px 0; font-size: 15px; color: #1A1A1A;"><strong>Type:</strong> ${isTeacher ? 'Teacher interested in contributing insights' : 'Student / Reader'}</p>
        <hr style="border: none; border-top: 1px solid #E5E1D8; margin: 16px 0;" />
        <p style="margin: 0 0 8px 0; font-size: 13px; color: #5C5A55; font-weight: bold; text-transform: uppercase;">Message:</p>
        <div style="white-space: pre-wrap; font-size: 15px; line-height: 1.6; color: #2A2A2A; background-color: #FAF8F5; padding: 16px; border-radius: 8px; border: 1px solid #E5E1D8;">${message}</div>
      </div>
    </div>
  `;

  try {
    const { data, error } = await client.emails.send({
      from: fromEmail,
      to: [recipient],
      replyTo: email,
      subject: `[Medhashine Contact] Message from ${name} (${isTeacher ? 'Teacher' : 'Reader'})`,
      html,
    });

    if (error) {
      console.error('[Resend Error]', error);
      throw new Error(error.message || 'Failed to send contact email via Resend');
    }

    return { success: true, data };
  } catch (err) {
    console.error('[sendContactEmail Exception]', err);
    throw err;
  }
}
