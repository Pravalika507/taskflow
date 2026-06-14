const nodemailer = require('nodemailer');

const fromEmail = process.env.SMTP_FROM || `"TaskFlow" <${process.env.SMTP_USER}>`;
const replyToEmail = process.env.SMTP_REPLY_TO || process.env.SMTP_USER;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: { rejectUnauthorized: false }
});

const sendVerificationEmail = async (name, email, token) => {
  const url = `${process.env.CLIENT_URL}/verify-email?token=${token}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Confirm your email</title></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e0e0e0;">
        <tr>
          <td style="background:#4f46e5;padding:28px 40px;text-align:center;">
            <span style="color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:0.5px;">TaskManager</span>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 16px;font-size:16px;color:#111111;">Hi ${name},</p>
            <p style="margin:0 0 16px;font-size:15px;color:#333333;line-height:1.6;">
              Thank you for creating an account with TaskManager. Please confirm your email address by clicking the button below.
            </p>
            <p style="margin:0 0 28px;font-size:15px;color:#333333;line-height:1.6;">
              This link will expire in <strong>24 hours</strong>.
            </p>
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="border-radius:6px;background:#4f46e5;">
                  <a href="${url}" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;border-radius:6px;">Confirm Email Address</a>
                </td>
              </tr>
            </table>
            <p style="margin:28px 0 0;font-size:13px;color:#888888;line-height:1.6;">
              If the button does not work, copy and paste this link into your browser:<br>
              <a href="${url}" style="color:#4f46e5;word-break:break-all;">${url}</a>
            </p>
            <p style="margin:20px 0 0;font-size:13px;color:#888888;">
              If you did not create this account, you can safely ignore this email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #eeeeee;text-align:center;">
            <p style="margin:0;font-size:12px;color:#aaaaaa;">TaskManager &mdash; karthikabonagiri0715@gmail.com</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `Hi ${name},

Thank you for creating an account with TaskManager.

Please confirm your email address by visiting the link below:
${url}

This link will expire in 24 hours.

If you did not create this account, you can safely ignore this email.

-- TaskManager`;

  await transporter.sendMail({
    from: fromEmail,
    to: email,
    subject: `Confirm your email address`,
    text,
    html,
    headers: {
      'Reply-To': replyToEmail,
      'Importance': 'normal'
    }
  });
};

const sendPasswordResetEmail = async (name, email, token) => {
  const url = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Reset your password</title></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e0e0e0;">
        <tr>
          <td style="background:#4f46e5;padding:28px 40px;text-align:center;">
            <span style="color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:0.5px;">TaskManager</span>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 16px;font-size:16px;color:#111111;">Hi ${name},</p>
            <p style="margin:0 0 16px;font-size:15px;color:#333333;line-height:1.6;">
              We received a request to reset your TaskManager password.
            </p>
            <p style="margin:0 0 28px;font-size:15px;color:#333333;line-height:1.6;">
              Click the button below to choose a new password. This link expires in <strong>15 minutes</strong>.
            </p>
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="border-radius:6px;background:#4f46e5;">
                  <a href="${url}" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;border-radius:6px;">Reset Password</a>
                </td>
              </tr>
            </table>
            <p style="margin:28px 0 0;font-size:13px;color:#888888;line-height:1.6;">
              If the button does not work, copy and paste this link into your browser:<br>
              <a href="${url}" style="color:#4f46e5;word-break:break-all;">${url}</a>
            </p>
            <p style="margin:20px 0 0;font-size:13px;color:#888888;">
              If you did not request a password reset, please ignore this email. Your password will not change.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #eeeeee;text-align:center;">
            <p style="margin:0;font-size:12px;color:#aaaaaa;">TaskManager &mdash; karthikabonagiri0715@gmail.com</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `Hi ${name},

We received a request to reset your TaskManager password.

Click the link below to choose a new password. This link expires in 15 minutes:
${url}

If you did not request a password reset, please ignore this email.

-- TaskManager`;

  await transporter.sendMail({
    from: fromEmail,
    to: email,
    subject: `Reset your password`,
    text,
    html,
    headers: {
      'Reply-To': replyToEmail,
      'Importance': 'normal'
    }
  });
};

const sendTaskAssignedEmail = async (name, email, task, assignedByName) => {
  const url = `${process.env.CLIENT_URL}/dashboard`;
  const dueText = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'No due date';
  const statusLabel = { todo: 'To Do', pending: 'In Progress', completed: 'Completed' }[task.status] || task.status;
  const priorityColor = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' }[task.priority] || '#6366f1';

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>New task assigned to you</title></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e0e0e0;">
        <tr>
          <td style="background:#4f46e5;padding:28px 40px;text-align:center;">
            <span style="color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:0.5px;">TaskFlow</span>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 8px;font-size:16px;color:#111111;">Hi ${name},</p>
            <p style="margin:0 0 24px;font-size:15px;color:#333333;line-height:1.6;">
              <strong>${assignedByName}</strong> assigned you a new task.
            </p>
            <table cellpadding="0" cellspacing="0" width="100%" style="border:1px solid #e2e8f0;border-radius:8px;margin:0 0 28px;overflow:hidden;">
              <tr><td style="background:#f8fafc;padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                <p style="margin:0;font-size:16px;font-weight:700;color:#1e293b;">${task.title}</p>
              </td></tr>
              <tr><td style="padding:16px 20px;">
                ${task.description ? `<p style="margin:0 0 14px;font-size:14px;color:#475569;line-height:1.6;">${task.description}</p>` : ''}
                <table cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td style="padding:4px 0;font-size:13px;color:#64748b;width:90px;">Priority</td>
                    <td style="padding:4px 0;font-size:13px;font-weight:600;" style="color:${priorityColor};">${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;font-size:13px;color:#64748b;">Due date</td>
                    <td style="padding:4px 0;font-size:13px;font-weight:600;color:#1e293b;">${dueText}</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;font-size:13px;color:#64748b;">Status</td>
                    <td style="padding:4px 0;font-size:13px;font-weight:600;color:#1e293b;">${statusLabel}</td>
                  </tr>
                </table>
              </td></tr>
            </table>
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="border-radius:6px;background:#4f46e5;">
                  <a href="${url}" style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:6px;">View Task →</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #eeeeee;text-align:center;">
            <p style="margin:0;font-size:12px;color:#aaaaaa;">TaskFlow &mdash; karthikabonagiri0715@gmail.com</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `Hi ${name},

${assignedByName} assigned you a new task.

Task:        ${task.title}
${task.description ? `Description: ${task.description}\n` : ''}Priority:    ${task.priority}
Due date:    ${dueText}
Status:      ${statusLabel}

View it here: ${url}

-- TaskFlow`;

  await transporter.sendMail({
    from: fromEmail,
    to: email,
    subject: `New task assigned to you: ${task.title}`,
    text,
    html,
    messageId: `<notif-${Date.now()}-${Math.random().toString(36).slice(2)}@taskflow.app>`
  });
};

const sendTaskStatusChangedEmail = async (recipientName, recipientEmail, taskTitle, newStatus, changerName) => {
  const url = `${process.env.CLIENT_URL}/dashboard`;
  const statusLabel = { todo: 'To Do', pending: 'In Progress', completed: 'Completed' }[newStatus] || newStatus;
  const statusColor = { todo: '#6366f1', pending: '#f59e0b', completed: '#22c55e' }[newStatus] || '#6366f1';
  const isCompleted = newStatus === 'completed';

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Task status updated</title></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e0e0e0;">
        <tr>
          <td style="background:#4f46e5;padding:28px 40px;text-align:center;">
            <span style="color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:0.5px;">TaskFlow</span>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 8px;font-size:16px;color:#111111;">Hi ${recipientName},</p>
            <p style="margin:0 0 24px;font-size:15px;color:#333333;line-height:1.6;">
              <strong>${changerName}</strong> ${isCompleted ? 'marked a task as completed' : 'updated the status of a task you\'re assigned to'}.
            </p>
            <table cellpadding="0" cellspacing="0" width="100%" style="border:1px solid #e2e8f0;border-radius:8px;margin:0 0 28px;overflow:hidden;">
              <tr><td style="background:#f8fafc;padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                <p style="margin:0;font-size:16px;font-weight:700;color:#1e293b;">${taskTitle}</p>
              </td></tr>
              <tr><td style="padding:16px 20px;">
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:4px 0;font-size:13px;color:#64748b;width:90px;">New status</td>
                    <td style="padding:4px 0;">
                      <span style="font-size:12px;font-weight:700;color:${statusColor};background:${statusColor}18;padding:3px 10px;border-radius:4px;">${statusLabel}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;font-size:13px;color:#64748b;">Updated by</td>
                    <td style="padding:4px 0;font-size:13px;font-weight:600;color:#1e293b;">${changerName}</td>
                  </tr>
                </table>
              </td></tr>
            </table>
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="border-radius:6px;background:#4f46e5;">
                  <a href="${url}" style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:6px;">View Task →</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #eeeeee;text-align:center;">
            <p style="margin:0;font-size:12px;color:#aaaaaa;">TaskFlow &mdash; karthikabonagiri0715@gmail.com</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `Hi ${recipientName},

${changerName} ${isCompleted ? 'marked a task as completed' : 'updated the status of a task you\'re assigned to'}.

Task:       ${taskTitle}
New status: ${statusLabel}
Updated by: ${changerName}

View it here: ${url}

-- TaskFlow`;

  await transporter.sendMail({
    from: fromEmail,
    to: recipientEmail,
    subject: `${changerName} marked "${taskTitle}" as ${statusLabel}`,
    text,
    html,
    messageId: `<notif-${Date.now()}-${Math.random().toString(36).slice(2)}@taskflow.app>`
  });
};

const sendInvitationEmail = async (inviterName, toEmail, token) => {
  const baseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const url = `${baseUrl}/accept-invite?token=${token}`;

  // Keep invitations plain text and neutral. Invite emails are more likely to
  // be treated as unsolicited than account emails the recipient just requested.
  const text = `Hi,

${inviterName} invited you to join their workspace in TaskFlow.

Open this secure invitation link to review and accept the invite:

${url}

This invitation expires in 7 days. If you do not have a TaskFlow account yet, create one with this email address first, then open the same invitation link.

If you were not expecting this invitation, you can ignore this email.

- TaskFlow`;

  await transporter.sendMail({
    from: fromEmail,
    replyTo: replyToEmail,
    to: toEmail,
    subject: `TaskFlow workspace invitation from ${inviterName}`,
    text,
  });
};

const sendTaskDeletedEmail = async (recipientName, recipientEmail, taskTitle, deleterName) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Task Deleted</title></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e0e0e0;">
        <tr>
          <td style="background:#4f46e5;padding:28px 40px;text-align:center;">
            <span style="color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:0.5px;">TaskManager</span>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 16px;font-size:16px;color:#111111;">Hi ${recipientName},</p>
            <p style="margin:0 0 16px;font-size:15px;color:#333333;line-height:1.6;">
              <strong>${deleterName}</strong> deleted a task that was assigned to you:
            </p>
            <table cellpadding="0" cellspacing="0" width="100%" style="border:1px solid #eeeeee;border-radius:6px;margin:0 0 24px;">
              <tr>
                <td style="padding:16px 20px;">
                  <p style="margin:0;font-size:15px;font-weight:bold;color:#111111;">${taskTitle}</p>
                </td>
              </tr>
            </table>
            <p style="margin:0;font-size:13px;color:#888888;">This task has been permanently removed from your workspace.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #eeeeee;text-align:center;">
            <p style="margin:0;font-size:12px;color:#aaaaaa;">TaskManager &mdash; karthikabonagiri0715@gmail.com</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `Hi ${recipientName},

${deleterName} deleted a task that was assigned to you:

"${taskTitle}"

This task has been permanently removed from your workspace.

-- TaskManager`;

  await transporter.sendMail({
    from: fromEmail,
    to: recipientEmail,
    subject: `${deleterName} deleted a task: ${taskTitle}`,
    text,
    html,
    messageId: `<notif-${Date.now()}-${Math.random().toString(36).slice(2)}@taskflow.app>`
  });
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail, sendTaskAssignedEmail, sendInvitationEmail, sendTaskDeletedEmail, sendTaskStatusChangedEmail };
