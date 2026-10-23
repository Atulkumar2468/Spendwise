import nodemailer from 'nodemailer';

/**
 * Send an email using Nodemailer
 * Supports production SMTP or auto-generates an Ethereal development test inbox
 */
export const sendEmail = async ({ to, subject, html, text, attachments = [] }) => {
  let transporter;
  let isTestAccount = false;

  // Check if custom SMTP is configured in environment
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Generate automatic Ethereal test inbox for development
    isTestAccount = true;
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  const fromAddress = process.env.EMAIL_FROM || '"SpendWise Finance" <no-reply@spendwise.app>';

  const mailOptions = {
    from: fromAddress,
    to,
    subject,
    text,
    html,
    attachments,
  };

  const info = await transporter.sendMail(mailOptions);

  let previewUrl = null;
  if (isTestAccount) {
    previewUrl = nodemailer.getTestMessageUrl(info);
    console.log('----------------------------------------------------');
    console.log('📧 PASSWORD RESET EMAIL DISPATCHED (Development Mode)');
    console.log(`To: ${to}`);
    console.log(`Preview Email in Browser: ${previewUrl}`);
    console.log('----------------------------------------------------');
  }

  return {
    messageId: info.messageId,
    previewUrl,
  };
};

/**
 * Generate SpendWise Notion-Style Password Reset Email HTML
 */
export const generatePasswordResetTemplate = (resetUrl, userName = 'there') => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your SpendWise Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8F9FA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1C1B1B;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F8F9FA; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background-color: #FFFFFF; border: 1px solid #ECECEC; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; text-align: center; border-bottom: 1px solid #F0EDED;">
              <div style="display: inline-block; width: 44px; height: 44px; background-color: #1C1B1B; border-radius: 12px; text-align: center; line-height: 44px;">
                <span style="color: #FFFFFF; font-size: 22px; font-weight: bold;">₹</span>
              </div>
              <h1 style="margin: 12px 0 4px 0; font-size: 22px; font-weight: 700; color: #1C1B1B; letter-spacing: -0.5px;">SpendWise</h1>
              <p style="margin: 0; font-size: 13px; color: #757575;">Personal Financial Ledger</p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #1C1B1B;">Reset Your Password</h2>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #4B4B4B;">
                Hello ${userName},
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #4B4B4B;">
                We received a request to reset the password for your SpendWise account. Click the button below to choose a new, secure password:
              </p>

              <!-- Action Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 12px 28px; background-color: #1C1B1B; color: #FFFFFF; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <div style="background-color: #F8F9FA; border: 1px solid #ECECEC; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 12px; color: #757575; line-height: 1.5;">
                  ⏱️ <strong>This reset link will expire in 15 minutes.</strong><br>
                  If you didn't request a password reset, you can safely ignore this email. Your current password remains secure.
                </p>
              </div>

              <p style="margin: 0; font-size: 12px; color: #8F8F8F; line-height: 1.5;">
                Or copy and paste this link into your browser:<br>
                <a href="${resetUrl}" style="color: #0F5132; word-break: break-all; font-size: 11px;">${resetUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #FCF9F8; border-top: 1px solid #F0EDED; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #9E9E9E;">
                © 2026 SpendWise Application • Clean & Secure Financial Management
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
};

/**
 * Generate SpendWise Notion-Style Monthly Financial Statement Email HTML
 */
export const generateStatementEmailTemplate = ({ userName, periodName, metrics, currency = 'INR' }) => {
  const fmt = (v) => `${currency} ${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SpendWise Monthly Financial Statement</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8F9FA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1C1B1B;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F8F9FA; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 540px; background-color: #FFFFFF; border: 1px solid #ECECEC; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 28px 32px; background-color: #1C1B1B; color: #FFFFFF;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size: 20px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.5px;">SpendWise</span>
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #CCCCCC;">Monthly Financial Statement</p>
                  </td>
                  <td align="right">
                    <span style="font-size: 13px; font-weight: 600; background-color: #333333; padding: 6px 12px; border-radius: 6px; color: #E0E0E0;">${periodName}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Summary Greeting -->
          <tr>
            <td style="padding: 28px 32px 16px 32px;">
              <h2 style="margin: 0 0 10px 0; font-size: 17px; font-weight: 600; color: #1C1B1B;">Hello ${userName},</h2>
              <p style="margin: 0 0 20px 0; font-size: 13.5px; line-height: 1.6; color: #4B4B4B;">
                Here is your official financial statement and ledger summary for <strong>${periodName}</strong>. Your full PDF statement and raw CSV spreadsheet have been attached to this email.
              </p>

              <!-- Metrics Grid -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td width="48%" style="padding: 14px; background-color: #FBFBFA; border: 1px solid #ECECEC; border-radius: 10px;">
                    <span style="font-size: 11px; font-weight: 600; color: #787774; text-transform: uppercase;">Total Income</span>
                    <p style="margin: 6px 0 0 0; font-size: 16px; font-weight: 700; color: #0F5132;">${fmt(metrics.monthlyIncome)}</p>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" style="padding: 14px; background-color: #FBFBFA; border: 1px solid #ECECEC; border-radius: 10px;">
                    <span style="font-size: 11px; font-weight: 600; color: #787774; text-transform: uppercase;">Total Expenses</span>
                    <p style="margin: 6px 0 0 0; font-size: 16px; font-weight: 700; color: #1C1B1B;">${fmt(metrics.monthlyExpenses)}</p>
                  </td>
                </tr>
                <tr><td height="10"></td></tr>
                <tr>
                  <td width="48%" style="padding: 14px; background-color: #FBFBFA; border: 1px solid #ECECEC; border-radius: 10px;">
                    <span style="font-size: 11px; font-weight: 600; color: #787774; text-transform: uppercase;">Net Savings</span>
                    <p style="margin: 6px 0 0 0; font-size: 16px; font-weight: 700; color: ${metrics.monthlySavings >= 0 ? '#0F5132' : '#842029'};">${fmt(metrics.monthlySavings)}</p>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" style="padding: 14px; background-color: #FBFBFA; border: 1px solid #ECECEC; border-radius: 10px;">
                    <span style="font-size: 11px; font-weight: 600; color: #787774; text-transform: uppercase;">Savings Rate</span>
                    <p style="margin: 6px 0 0 0; font-size: 16px; font-weight: 700; color: #1C1B1B;">${(metrics.savingsRate || 0).toFixed(1)}%</p>
                  </td>
                </tr>
              </table>

              <!-- Attachment Note -->
              <div style="background-color: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 10px; padding: 14px 16px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 12px; color: #166534; line-height: 1.5;">
                  📎 <strong>2 Files Attached:</strong><br>
                  • <strong>SpendWise_Financial_Statement_${periodName.replace(' ', '_')}.pdf</strong> (Formal PDF report)<br>
                  • <strong>SpendWise_Transactions_${periodName.replace(' ', '_')}.csv</strong> (Itemized spreadsheet)
                </p>
              </div>

              <p style="margin: 0; font-size: 12px; color: #787774; line-height: 1.5;">
                You can also view real-time interactive charts, envelope budgets, and analytics directly on your SpendWise dashboard.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #FCF9F8; border-top: 1px solid #F0EDED; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #9E9E9E;">
                © 2026 SpendWise Application • Automated Financial Telemetry
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
};

