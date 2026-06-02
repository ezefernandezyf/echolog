export function render(workspaceName: string, newRole: string): string {
  const roleDisplay = newRole.charAt(0).toUpperCase() + newRole.slice(1).toLowerCase();

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Your Role Has Changed</title>
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
          <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 600; color: #111827;">
            Role Updated
          </h2>
          <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #374151;">
            Your role in the <strong style="color: #111827;">${workspaceName}</strong> workspace has been updated to <strong style="color: #111827;">${roleDisplay}</strong>.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding: 8px 40px 20px;">
          <a href="${process.env.BASE_URL ?? 'http://localhost:3001'}"
             style="display: inline-block; padding: 12px 32px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; text-align: center;">
            Go to ${workspaceName}
          </a>
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
