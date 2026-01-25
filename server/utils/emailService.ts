import nodemailer from 'nodemailer';

// Email configuration from environment variables
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'info@sollo.co.il';

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) {
    return transporter;
  }

  // If SMTP credentials are not configured, return null
  if (!SMTP_USER || !SMTP_PASS) {
    console.warn('⚠️  SMTP credentials not configured. Email sending will be disabled.');
    console.warn('   Please set SMTP_USER and SMTP_PASS environment variables.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // true for 465, false for other ports
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  return transporter;
}

/**
 * Send a contact form email
 */
export async function sendContactEmail(data: {
  name: string;
  email: string;
  message: string;
}): Promise<void> {
  const emailTransporter = getTransporter();

  if (!emailTransporter) {
    throw new Error('Email service is not configured. Please contact support directly.');
  }

  const mailOptions = {
    from: `"${data.name}" <${SMTP_USER}>`,
    replyTo: data.email,
    to: CONTACT_EMAIL,
    subject: `Contact Form Submission from ${data.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ec4899;">New Contact Form Submission</h2>
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Name:</strong> ${escapeHtml(data.name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
          <p><strong>Message:</strong></p>
          <div style="background-color: white; padding: 15px; border-radius: 4px; margin-top: 10px;">
            ${escapeHtml(data.message).replace(/\n/g, '<br>')}
          </div>
        </div>
        <p style="color: #6b7280; font-size: 12px;">
          This email was sent from the SOLLO contact form.
        </p>
      </div>
    `,
    text: `
New Contact Form Submission

Name: ${data.name}
Email: ${data.email}

Message:
${data.message}

---
This email was sent from the SOLLO contact form.
    `,
  };

  try {
    await emailTransporter.sendMail(mailOptions);
    console.log(`✅ Contact email sent successfully from ${data.email} to ${CONTACT_EMAIL}`);
  } catch (error: any) {
    console.error('❌ Failed to send contact email:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

/**
 * Verify email configuration
 */
export async function verifyEmailConfig(): Promise<boolean> {
  const emailTransporter = getTransporter();

  if (!emailTransporter) {
    return false;
  }

  try {
    await emailTransporter.verify();
    console.log('✅ Email service configuration verified');
    return true;
  } catch (error: any) {
    console.error('❌ Email service configuration verification failed:', error);
    return false;
  }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
