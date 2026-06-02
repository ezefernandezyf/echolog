import { logger } from '../infra/logger.js';
import { resendClient, emailConfig } from './email.config.js';
import { render as renderInvitation } from './templates/invitation.js';
import { render as renderWelcome } from './templates/welcome.js';
import { render as renderRoleChanged } from './templates/role-changed.js';

export class EmailService {
  /**
   * Sends an invitation email to a registered user.
   * Handles the test environment guard internally.
   */
  async sendInvitationEmail(
    token: string,
    invitedEmail: string,
    workspaceName: string,
    inviterName: string,
  ): Promise<void> {
    if (process.env.NODE_ENV === 'test') return;

    await this.withEmailErrorHandling(
      async () => {
        const html = renderInvitation(token, workspaceName, inviterName);
        await resendClient!.emails.send({
          from: emailConfig.from,
          to: invitedEmail,
          subject: `${inviterName} invited you to ${workspaceName}`,
          html,
        });
      },
      { type: 'invitation', recipient: invitedEmail },
    );
  }

  /**
   * Sends a role change notification email.
   * Guards against missing userEmail.
   */
  async sendRoleChangedEmail(
    userEmail: string | null | undefined,
    workspaceName: string,
    newRole: string,
  ): Promise<void> {
    if (!userEmail) return;
    if (process.env.NODE_ENV === 'test') return;

    await this.withEmailErrorHandling(
      async () => {
        const html = renderRoleChanged(workspaceName, newRole);
        await resendClient!.emails.send({
          from: emailConfig.from,
          to: userEmail,
          subject: `Your role in ${workspaceName} was updated to ${newRole}`,
          html,
        });
      },
      { type: 'role-changed', recipient: userEmail },
    );
  }

  /**
   * Sends a welcome email after registration.
   * Handles null userName gracefully in the template.
   */
  async sendWelcomeEmail(
    userEmail: string,
    userName: string | null,
  ): Promise<void> {
    if (process.env.NODE_ENV === 'test') return;

    await this.withEmailErrorHandling(
      async () => {
        const html = renderWelcome(userName);
        await resendClient!.emails.send({
          from: emailConfig.from,
          to: userEmail,
          subject: 'Welcome to EchoLog!',
          html,
        });
      },
      { type: 'welcome', recipient: userEmail },
    );
  }

  /**
   * Wraps an email-sending function with error handling.
   * - Exits early in test mode
   * - Catches all errors and logs them via pino
   * - NEVER rethrows — email failures must not block primary operations
   */
  private async withEmailErrorHandling<T>(
    fn: () => Promise<T>,
    context: { type: string; recipient: string },
  ): Promise<void> {
    if (process.env.NODE_ENV === 'test') return;

    try {
      await fn();
    } catch (error) {
      logger.error(
        { error, emailType: context.type, recipient: context.recipient },
        'Failed to send email',
      );
    }
  }
}

export const emailService = new EmailService();
