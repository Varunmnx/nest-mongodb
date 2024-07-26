import { Injectable, Logger } from '@nestjs/common';
import { google, gmail_v1 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { handleError } from '@/common/utils/utils';
import { EmailMessage } from './types';
import { EmailLabel } from '@/common/enums/email.enum';

interface MailOptions {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

@Injectable()
export class GoogleMailProvider {
  private gmail: gmail_v1.Gmail;
  private readonly logger = new Logger(GoogleMailProvider.name);

  constructor(private readonly options: MailOptions) {
    this.gmail = google.gmail({ version: 'v1' });
  }

  private createOAuthClient(refreshToken: string): OAuth2Client {
    const client = new google.auth.OAuth2(this.options.clientId, this.options.clientSecret, this.options.redirectUri);
    client.setCredentials({ refresh_token: refreshToken });
    return client;
  }

  private getResource<T extends keyof gmail_v1.Gmail>(refreshToken: string, resourceName: T): gmail_v1.Gmail[T] {
    const auth = this.createOAuthClient(refreshToken);
    this.gmail = google.gmail({ version: 'v1', auth });
    return this.gmail[resourceName];
  }

  getUserResource(refreshToken: string): gmail_v1.Resource$Users {
    return this.getResource(refreshToken, 'users');
  }

  private createRawEmail(emailMessage: EmailMessage): string {
    try {
      // Check if emailMessage is defined and not null
      if (!emailMessage) {
        throw new Error('Email message is required');
      }

      const boundary = 'boundary';
      let raw = `Content-Type: multipart/mixed; boundary="${boundary}"\n`;

      // Handle 'From' field
      if (emailMessage.from) {
        raw += `From: ${emailMessage.from.name ? `${emailMessage.from.name} <${emailMessage.from.email}>` : emailMessage.from.email}\n`;
      } else {
        throw new Error('Sender email is required');
      }

      // Handle 'To' field
      if (emailMessage.to && emailMessage.to.length > 0) {
        raw += `To: ${emailMessage.to.map((to) => (to.name ? `${to.name} <${to.email}>` : to.email)).join(', ')}\n`;
      } else {
        throw new Error('Recipient email(s) are required');
      }

      // Handle 'Cc' field (if provided)
      if (emailMessage.cc) {
        raw += `Cc: ${emailMessage.cc.map((cc) => (cc.name ? `${cc.name} <${cc.email}>` : cc.email)).join(', ')}\n`;
      }

      // Handle 'Bcc' field (if provided)
      if (emailMessage.bcc) {
        raw += `Bcc: ${emailMessage.bcc.map((bcc) => (bcc.name ? `${bcc.name} <${bcc.email}>` : bcc.email)).join(', ')}\n`;
      }

      // Handle 'Subject' field
      raw += `Subject: ${emailMessage.subject ?? ''}\n\n`;

      // Add boundary for email body
      raw += `--${boundary}\n`;

      // Handle text body (if provided)
      if (emailMessage.body?.text) {
        raw += `Content-Type: text/plain; charset="UTF-8"\n\n`;
        raw += `${emailMessage.body.text}\n\n`;
        raw += `--${boundary}\n`;
      }

      // Handle HTML body (if provided)
      if (emailMessage.body?.html) {
        raw += `Content-Type: text/html; charset="UTF-8"\n\n`;
        raw += `${emailMessage.body.html}\n\n`;
        raw += `--${boundary}\n`;
      }

      // Handle attachments (if provided)
      if (emailMessage.attachments) {
        emailMessage.attachments.forEach((attachment) => {
          if (attachment.body?.data && attachment.filename) {
            raw += `Content-Type: ${attachment.mimeType}; name="${attachment.filename}"\n`;
            raw += `Content-Disposition: attachment; filename="${attachment.filename}"\n`;
            raw += `Content-Transfer-Encoding: base64\n\n`;
            raw += `${attachment.body.data}\n\n`;
            raw += `--${boundary}\n`;
          } else {
            throw new Error(`Attachment '${attachment.filename}' is missing data or filename`);
          }
        });
      }

      // End boundary
      raw += `--${boundary}--`;

      // Convert to base64 format
      return Buffer.from(raw).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    } catch (error) {
      console.error('Failed to create raw email:', error);
      throw new Error('Error creating raw email');
    }
  }

  async listMessages(
    refreshToken: string,
    query?: string,
    maxResults: number = 10,
    pageToken?: string,
    labelIds = [EmailLabel.INBOX, EmailLabel.UNREAD],
  ): Promise<gmail_v1.Schema$Message[]> {
    try {
      const messages = this.getUserResource(refreshToken).messages;
      const res = await messages.list({
        userId: 'me',
        q: query,
        maxResults,
        pageToken,
        labelIds: labelIds || [],
      });
      return res.data.messages || [];
    } catch (error) {
      this.logger.error(`Failed to list messages: ${handleError(error)}`);
      throw error;
    }
  }

  async getMessage(refreshToken: string, messageId: string, format: string = 'full'): Promise<gmail_v1.Schema$Message> {
    try {
      const { messages } = this.getUserResource(refreshToken);
      const res = await messages.get({
        userId: 'me',
        id: messageId,
        format,
      });
      return res.data;
    } catch (error) {
      this.logger.error(`Failed to get message ${messageId}: ${handleError(error)}`);
      throw error;
    }
  }

  async sendMessage(refreshToken: string, emailMessage: EmailMessage): Promise<gmail_v1.Schema$Message> {
    try {
      const messages = this.getUserResource(refreshToken).messages;
      const raw = this.createRawEmail(emailMessage);
      const res = await messages.send({
        userId: 'me',
        requestBody: {
          raw,
        },
      });
      this.logger.log(`Message sent: ${res.data.id}`);
      return res.data;
    } catch (error) {
      this.logger.error(`Failed to send message: ${handleError(error)}`);
      throw error;
    }
  }

  async deleteMessage(refreshToken: string, messageId: string): Promise<void> {
    try {
      const { messages } = this.getUserResource(refreshToken);
      await messages.delete({
        userId: 'me',
        id: messageId,
      });
      this.logger.log(`Message deleted: ${messageId}`);
    } catch (error) {
      this.logger.error(`Failed to delete message ${messageId}: ${handleError(error)}`);
      throw error;
    }
  }

  async updateLabels(
    refreshToken: string,
    messageId: string,
    addLabelIds: string[],
    removeLabelIds: string[],
  ): Promise<gmail_v1.Schema$Message> {
    try {
      const { messages } = this.getUserResource(refreshToken);
      const res = await messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          addLabelIds,
          removeLabelIds,
        },
      });
      this.logger.log(`Labels updated for message: ${messageId}`);
      return res.data;
    } catch (error) {
      this.logger.error(`Failed to update labels for message ${messageId}: ${handleError(error)}`);
      throw error;
    }
  }

  async batchDeleteMessages(refreshToken: string, messageIds: string[]): Promise<void> {
    try {
      const { messages } = this.getUserResource(refreshToken);
      await messages.batchDelete({
        userId: 'me',
        requestBody: {
          ids: messageIds,
        },
      });
      this.logger.log(`Messages batch deleted: ${messageIds.join(', ')}`);
    } catch (error) {
      this.logger.error(`Failed to batch delete messages: ${handleError(error)}`);
      throw error;
    }
  }

  async batchModifyMessages(
    refreshToken: string,
    messageIds: string[],
    addLabelIds: string[],
    removeLabelIds: string[],
  ): Promise<void> {
    try {
      const { messages } = this.getUserResource(refreshToken);
      await messages.batchModify({
        userId: 'me',
        requestBody: {
          ids: messageIds,
          addLabelIds,
          removeLabelIds,
        },
      });
      this.logger.log(`Messages batch modified: ${messageIds.join(', ')}`);
    } catch (error) {
      this.logger.error(`Failed to batch modify messages: ${handleError(error)}`);
      throw error;
    }
  }
}
