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

function getAdminRecipientEmails() {
  const raw = process.env.ADMIN_EMAIL || process.env.CONTACT_EMAIL || '';
  const emails = raw
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);
  return emails.length > 0 ? emails : ['delivered@resend.dev'];
}

export async function sendContactEmail({ name, email, isTeacher, message }) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || 'Medhashine <onboarding@resend.dev>';
  const recipients = getAdminRecipientEmails();

  console.log(`[Contact Form Submission]\nFrom: ${name} <${email}>\nTeacher: ${isTeacher ? 'Yes' : 'No'}\nMessage: ${message}`);

  if (!apiKey) {
    console.warn('[Resend] RESEND_API_KEY is not set in process.env. Message logged to server console above.');
    return { success: true, devMode: true };
  }

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
      to: recipients,
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

// ─── Teacher Application Emails ─────────────────────────────────────────────

export async function sendTeacherApplicationAdminNotification(applicantName, applicantEmail, adminDashboardLink) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || 'Medhashine <onboarding@resend.dev>';
  const recipients = getAdminRecipientEmails();

  console.log(`[Teacher Application] New application from ${applicantName} <${applicantEmail}>`);

  if (!apiKey) {
    console.warn('[Resend] RESEND_API_KEY or ADMIN_EMAIL not set. Notification logged to console.');
    return { success: true, devMode: true };
  }

  const client = getResendClient();
  const html = `
    <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; border-radius: 16px; overflow: hidden; border: 1px solid #E5E1D8;">
      <div style="background: linear-gradient(135deg, #A84C32 0%, #8B3A25 100%); padding: 32px 28px; text-align: center;">
        <h1 style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 6px 0; letter-spacing: -0.3px;">New Teacher Application</h1>
        <p style="color: rgba(255,255,255,0.8); font-size: 14px; margin: 0;">A new educator wants to join Medhashine</p>
      </div>
      <div style="padding: 28px; background-color: #FAF8F5;">
        <div style="background: #ffffff; border-radius: 12px; padding: 20px; border: 1px solid #E5E1D8; margin-bottom: 20px;">
          <p style="margin: 0 0 8px 0; font-size: 15px; color: #1A1A1A;"><strong>Applicant:</strong> ${applicantName}</p>
          <p style="margin: 0; font-size: 15px; color: #1A1A1A;"><strong>Email:</strong> <a href="mailto:${applicantEmail}" style="color: #A84C32;">${applicantEmail}</a></p>
        </div>
        <div style="text-align: center;">
          <a href="${adminDashboardLink}" style="display: inline-block; background: linear-gradient(135deg, #A84C32 0%, #8B3A25 100%); color: #ffffff; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 14px; letter-spacing: 0.3px;">Review Application →</a>
        </div>
      </div>
    </div>
  `;

  try {
    const { data, error } = await client.emails.send({
      from: fromEmail,
      to: recipients,
      subject: `[Medhashine] New Teacher Application — ${applicantName}`,
      html,
    });
    if (error) { console.error('[Resend Error]', error); throw new Error(error.message); }
    return { success: true, data };
  } catch (err) {
    console.error('[sendTeacherApplicationAdminNotification Exception]', err);
    // Don't throw — application should still succeed even if email fails
    return { success: false, error: err.message };
  }
}

export async function sendTeacherApprovalEmail(toEmail, name, teacherPortalLink) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || 'Medhashine <onboarding@resend.dev>';

  console.log(`[Teacher Approved] ${name} <${toEmail}> — Portal: ${teacherPortalLink}`);

  if (!apiKey) {
    console.warn('[Resend] RESEND_API_KEY not set. Approval logged to console.');
    return { success: true, devMode: true };
  }

  const client = getResendClient();
  const html = `
    <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; border-radius: 16px; overflow: hidden; border: 1px solid #E5E1D8;">
      <div style="background: linear-gradient(135deg, #16A34A 0%, #15803D 100%); padding: 32px 28px; text-align: center;">
        <div style="font-size: 40px; margin-bottom: 8px;">🎉</div>
        <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0 0 6px 0;">Welcome Aboard, ${name}!</h1>
        <p style="color: rgba(255,255,255,0.85); font-size: 14px; margin: 0;">Your teacher application has been approved</p>
      </div>
      <div style="padding: 28px; background-color: #FAF8F5;">
        <div style="background: #ffffff; border-radius: 12px; padding: 24px; border: 1px solid #E5E1D8; margin-bottom: 20px;">
          <p style="margin: 0 0 12px 0; font-size: 15px; color: #1A1A1A; line-height: 1.6;">Congratulations! You are now an official <strong>Medhashine Teacher</strong>. You can start creating and publishing insights for students right away.</p>
          <p style="margin: 0; font-size: 15px; color: #5C5A55; line-height: 1.6;">Your expertise matters. Every insight you share helps shape the minds of tomorrow.</p>
        </div>
        <div style="text-align: center;">
          <a href="${teacherPortalLink}" style="display: inline-block; background: linear-gradient(135deg, #16A34A 0%, #15803D 100%); color: #ffffff; padding: 14px 36px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px; letter-spacing: 0.3px;">Open Teacher Portal →</a>
          <p style="margin: 16px 0 0 0; font-size: 12px; color: #9CA3AF;">Bookmark this link to access your teacher dashboard anytime</p>
        </div>
      </div>
    </div>
  `;

  try {
    const { data, error } = await client.emails.send({
      from: fromEmail,
      to: [toEmail],
      subject: `🎉 You're Approved! Welcome to Medhashine, ${name}`,
      html,
    });
    if (error) { console.error('[Resend Error]', error); throw new Error(error.message); }
    return { success: true, data };
  } catch (err) {
    console.error('[sendTeacherApprovalEmail Exception]', err);
    return { success: false, error: err.message };
  }
}

export async function sendTeacherRejectionEmail(toEmail, name, reason) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || 'Medhashine <onboarding@resend.dev>';

  console.log(`[Teacher Rejected] ${name} <${toEmail}> — Reason: ${reason}`);

  if (!apiKey) {
    console.warn('[Resend] RESEND_API_KEY not set. Rejection logged to console.');
    return { success: true, devMode: true };
  }

  const client = getResendClient();
  const html = `
    <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; border-radius: 16px; overflow: hidden; border: 1px solid #E5E1D8;">
      <div style="background: linear-gradient(135deg, #6B7280 0%, #4B5563 100%); padding: 32px 28px; text-align: center;">
        <h1 style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 6px 0;">Application Update</h1>
        <p style="color: rgba(255,255,255,0.8); font-size: 14px; margin: 0;">Regarding your Medhashine teacher application</p>
      </div>
      <div style="padding: 28px; background-color: #FAF8F5;">
        <div style="background: #ffffff; border-radius: 12px; padding: 24px; border: 1px solid #E5E1D8; margin-bottom: 20px;">
          <p style="margin: 0 0 12px 0; font-size: 15px; color: #1A1A1A; line-height: 1.6;">Hi ${name},</p>
          <p style="margin: 0 0 16px 0; font-size: 15px; color: #1A1A1A; line-height: 1.6;">Thank you for your interest in becoming a teacher on Medhashine. After careful review, we are unable to approve your application at this time.</p>
          ${reason ? `
          <div style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 600; color: #991B1B; text-transform: uppercase; letter-spacing: 0.5px;">Reason</p>
            <p style="margin: 0; font-size: 14px; color: #7F1D1D; line-height: 1.5;">${reason}</p>
          </div>
          ` : ''}
          <p style="margin: 0; font-size: 14px; color: #5C5A55; line-height: 1.6;">You are welcome to apply again in the future. If you have questions, please reach out via our contact page.</p>
        </div>
      </div>
    </div>
  `;

  try {
    const { data, error } = await client.emails.send({
      from: fromEmail,
      to: [toEmail],
      subject: `Medhashine Teacher Application — Update for ${name}`,
      html,
    });
    if (error) { console.error('[Resend Error]', error); throw new Error(error.message); }
    return { success: true, data };
  } catch (err) {
    console.error('[sendTeacherRejectionEmail Exception]', err);
    return { success: false, error: err.message };
  }
}
