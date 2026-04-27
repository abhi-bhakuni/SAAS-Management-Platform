import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private mailerService: MailerService) {}

  private getFrontendBaseUrl(): string {
    return process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:5173';
  }

  async sendInviteEmail(
    email: string,
    inviteToken: string,
    organizationName: string,
    inviterName: string,
  ): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: `You've been invited to join ${organizationName}`,
        template: 'invite',
        context: {
          email,
          inviteToken,
          organizationName,
          inviterName,
          signupInviteUrl: `${this.getFrontendBaseUrl()}/auth?mode=signup&inviteId=${encodeURIComponent(inviteToken)}`,
        },
      });
      this.logger.log(`Invite email sent to ${email} for organization ${organizationName}`);
    } catch (error) {
      this.logger.error(`Failed to send invite email to ${email}:`, error);
      throw error;
    }
  }

  async sendAcceptanceConfirmation(
    email: string,
    organizationName: string,
  ): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: `Welcome to ${organizationName}!`,
        template: 'acceptance-confirmation',
        context: {
          email,
          organizationName,
          loginUrl: `${this.getFrontendBaseUrl()}/login`,
        },
      });
      this.logger.log(`Acceptance confirmation email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send acceptance confirmation email to ${email}:`, error);
      throw error;
    }
  }

  async sendEmail(
    to: string,
    template: string,
    context: Record<string, any>,
    subject: string,
  ): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to,
        subject,
        template,
        context,
      });
      this.logger.log(`Email sent to ${to} using template ${template}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      throw error;
    }
  }
}
