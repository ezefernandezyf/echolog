import { emailConfig } from '../email.config.js';

export function render(token: string, workspaceName: string, inviterName: string): string {
  const inviteLink = `${emailConfig.baseUrl}/invite/${token}`;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>You're Invited to ${workspaceName}</title>
  </head>
  <body style="font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 0; background-color: #f9fafb;">
    <table role="presentation" style="width: 100%; max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden;">
      <tr>
        <td style="padding: 32px 40px 20px;">
          <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 700; color: #4f46e5;">EchoLog</h1>
        </td>
      </tr>
      <tr>
        <td style="padding: 0 40px 12px;">
          <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #374151;">
            <strong style="color: #111827;">${inviterName}</strong> has invited you to join the <strong style="color: #111827;">${workspaceName}</strong> workspace on EchoLog.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding: 20px 40px 8px;">
          <a href="${inviteLink}"
             style="display: inline-block; padding: 12px 32px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; text-align: center;">
            Accept Invitation
          </a>
        </td>
      </tr>
      <tr>
        <td style="padding: 4px 40px 12px;">
          <p style="margin: 0; font-size: 13px; color: #9ca3af;">
            Or copy this link: <a href="${inviteLink}" style="color: #4f46e5; word-break: break-all;">${inviteLink}</a>
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding: 20px 40px;">
          <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.5;">
            This invitation expires in 7 days. If you were not expecting this invitation, you can safely ignore this email.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding: 20px 40px 32px; border-top: 1px solid #f3f4f6;">
          <p style="margin: 0; font-size: 12px; color: #9ca3af;">
            &copy; ${new Date().getFullYear()} EchoLog. All rights reserved.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
