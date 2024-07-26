import { gmail_v1 } from 'googleapis';

export interface EmailAddress {
  name?: string;
  email: string;
}

export interface EmailMessage {
  from?: EmailAddress;
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  subject: string;
  body: {
    text?: string;
    html?: string;
  };
  attachments?: gmail_v1.Schema$MessagePart[];
}
