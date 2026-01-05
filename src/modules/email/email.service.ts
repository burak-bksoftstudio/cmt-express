import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;
  private from: string;

  constructor() {
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;

    if (!emailUser || !emailPassword) {
      console.warn("⚠️  Email credentials not configured. Email sending disabled.");
      this.transporter = null as any;
      this.from = "";
      return;
    }

    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPassword, // App password
      },
    });

    this.from = `CMT Platform <${emailUser}>`;

    // Verify connection
    this.transporter.verify((error) => {
      if (error) {
        console.error("❌ Email service connection failed:", error);
      } else {
        console.log("✅ Email service ready");
      }
    });
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    if (!this.transporter) {
      console.warn(`📧 Email not sent (service disabled): ${options.subject} to ${options.to}`);
      return;
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, ""), // Strip HTML for text version
      });

      console.log(`📧 Email sent: ${options.subject} to ${options.to} (${info.messageId})`);
    } catch (error) {
      console.error(`❌ Failed to send email to ${options.to}:`, error);
      throw error;
    }
  }

  async sendInvitationEmail(params: {
    inviteeEmail: string;
    inviterName: string;
    conferenceName: string;
    role: string;
    message?: string;
    invitationId: string;
    existingUser: boolean;
  }): Promise<void> {
    const { inviteeEmail, inviterName, conferenceName, role, message, invitationId, existingUser } = params;

    const acceptUrl = `${process.env.FRONTEND_URL || "http://localhost:3001"}/invitations/${invitationId}/accept`;
    const declineUrl = `${process.env.FRONTEND_URL || "http://localhost:3001"}/invitations/${invitationId}/decline`;
    const signUpUrl = `${process.env.FRONTEND_URL || "http://localhost:3001"}/sign-up`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 12px 24px; margin: 10px 5px; border-radius: 6px; text-decoration: none; font-weight: 600; }
          .button-accept { background: #10b981; color: white; }
          .button-decline { background: #ef4444; color: white; }
          .button-signup { background: #3b82f6; color: white; }
          .message-box { background: white; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Conference Invitation</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p><strong>${inviterName}</strong> has invited you to join the conference <strong>${conferenceName}</strong> as a <strong>${role.toUpperCase()}</strong>.</p>

            ${message ? `
              <div class="message-box">
                <p style="margin: 0;"><strong>Personal message:</strong></p>
                <p style="margin: 10px 0 0 0;">${message}</p>
              </div>
            ` : ''}

            ${existingUser ? `
              <p>You can accept or decline this invitation:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${acceptUrl}" class="button button-accept">Accept Invitation</a>
                <a href="${declineUrl}" class="button button-decline">Decline</a>
              </div>
            ` : `
              <p>To accept this invitation, you need to create an account first:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${signUpUrl}" class="button button-signup">Create Account & Accept</a>
              </div>
              <p style="font-size: 14px; color: #6b7280;">After signing up, you can view and accept your invitation from your dashboard.</p>
            `}

            <div class="footer">
              <p>This invitation was sent through the CMT (Conference Management Tool) platform.</p>
              <p>If you didn't expect this invitation, you can safely ignore this email.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: inviteeEmail,
      subject: `Conference Invitation: ${conferenceName}`,
      html,
    });
  }

  async sendInvitationAcceptedEmail(params: {
    inviterEmail: string;
    inviteeName: string;
    conferenceName: string;
    role: string;
  }): Promise<void> {
    const { inviterEmail, inviteeName, conferenceName, role } = params;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 30px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">✅ Invitation Accepted</h1>
          </div>
          <div class="content">
            <p>Good news!</p>
            <p><strong>${inviteeName}</strong> has accepted your invitation to join <strong>${conferenceName}</strong> as a <strong>${role.toUpperCase()}</strong>.</p>
            <p>They are now a member of the conference and can start participating.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: inviterEmail,
      subject: `Invitation Accepted: ${inviteeName} joined ${conferenceName}`,
      html,
    });
  }

  async sendInvitationDeclinedEmail(params: {
    inviterEmail: string;
    inviteeName: string;
    conferenceName: string;
    role: string;
  }): Promise<void> {
    const { inviterEmail, inviteeName, conferenceName, role } = params;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ef4444; color: white; padding: 30px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Invitation Declined</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p><strong>${inviteeName}</strong> has declined your invitation to join <strong>${conferenceName}</strong> as a <strong>${role.toUpperCase()}</strong>.</p>
            <p>You may want to reach out to them directly if needed.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: inviterEmail,
      subject: `Invitation Declined: ${conferenceName}`,
      html,
    });
  }
}

export const emailService = new EmailService();
