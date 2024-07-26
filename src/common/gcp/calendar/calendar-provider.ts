import { Injectable, Logger } from '@nestjs/common';
import { google, calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { handleError } from '@/common/utils/utils';

interface CalendarOptions {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

@Injectable()
export class GoogleCalendarProvider {
  private calendar: calendar_v3.Calendar;
  private readonly logger = new Logger(GoogleCalendarProvider.name);

  constructor(private readonly options: CalendarOptions) {
    this.calendar = google.calendar({ version: 'v3' });
  }

  private createOAuthClient(refreshToken: string): OAuth2Client {
    const client = new google.auth.OAuth2(this.options.clientId, this.options.clientSecret, this.options.redirectUri);
    client.setCredentials({ refresh_token: refreshToken });
    return client;
  }

  private getResource<T extends keyof calendar_v3.Calendar>(
    refreshToken: string,
    resourceName: T,
  ): calendar_v3.Calendar[T] {
    const auth = this.createOAuthClient(refreshToken);
    this.calendar = google.calendar({ version: 'v3', auth });
    return this.calendar[resourceName];
  }

  getCalendarResource(refreshToken: string) {
    return this.getResource(refreshToken, 'calendars');
  }

  getEventsResource(refreshToken: string) {
    return this.getResource(refreshToken, 'events');
  }

  getChannelsResource(refreshToken: string) {
    return this.getResource(refreshToken, 'channels');
  }

  getFreebusyResource(refreshToken: string) {
    return this.getResource(refreshToken, 'freebusy');
  }

  getSettingsResource(refreshToken: string) {
    return this.getResource(refreshToken, 'settings');
  }

  getAclResource(refreshToken: string) {
    return this.getResource(refreshToken, 'acl');
  }

  getColorsResource(refreshToken: string) {
    return this.getResource(refreshToken, 'colors');
  }

  getCalendarListResource(refreshToken: string) {
    return this.getResource(refreshToken, 'calendarList');
  }

  async listEvents(refreshToken: string, timeMin?: string, timeMax?: string): Promise<calendar_v3.Schema$Event[]> {
    try {
      const events = this.getEventsResource(refreshToken);
      const res = await events.list({
        calendarId: 'primary',
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: 'startTime',
      });
      return res.data.items;
    } catch (error) {
      this.logger.error(`Failed to list events: ${handleError(error)}`);
      throw error;
    }
  }

  async createEvent(refreshToken: string, event: calendar_v3.Schema$Event): Promise<calendar_v3.Schema$Event> {
    try {
      const events = this.getEventsResource(refreshToken);
      const res = await events.insert({
        calendarId: 'primary',
        requestBody: event,
      });
      this.logger.log(`Event created: ${res.data.id}`);
      return res.data;
    } catch (error) {
      this.logger.error(`Failed to create event: ${handleError(error)}`);
      throw error;
    }
  }

  async updateEvent(
    refreshToken: string,
    eventId: string,
    event: calendar_v3.Schema$Event,
  ): Promise<calendar_v3.Schema$Event> {
    try {
      const events = this.getEventsResource(refreshToken);
      const res = await events.update({
        calendarId: 'primary',
        eventId,
        requestBody: event,
      });
      this.logger.log(`Event updated: ${eventId}`);
      return res.data;
    } catch (error) {
      this.logger.error(`Failed to update event ${eventId}: ${handleError(error)}`);
      throw error;
    }
  }

  async deleteEvent(refreshToken: string, eventId: string): Promise<void> {
    try {
      const events = this.getEventsResource(refreshToken);
      await events.delete({
        calendarId: 'primary',
        eventId,
      });
      this.logger.log(`Event deleted: ${eventId}`);
    } catch (error) {
      this.logger.error(`Failed to delete event ${eventId}: ${handleError(error)}`);
      throw error;
    }
  }

  async getEvent(refreshToken: string, eventId: string): Promise<calendar_v3.Schema$Event> {
    try {
      const events = this.getEventsResource(refreshToken);
      const res = await events.get({
        calendarId: 'primary',
        eventId,
      });
      return res.data;
    } catch (error) {
      this.logger.error(`Failed to get event ${eventId}: ${handleError(error)}`);
      throw error;
    }
  }

  async listCalendars(refreshToken: string): Promise<calendar_v3.Schema$CalendarListEntry[]> {
    try {
      const calendarList = this.getCalendarListResource(refreshToken);
      const res = await calendarList.list();
      return res.data.items;
    } catch (error) {
      this.logger.error(`Failed to list calendars: ${handleError(error)}`);
      throw error;
    }
  }

  async addReminder(refreshToken: string, eventId: string, minutes: number): Promise<void> {
    try {
      const events = this.getEventsResource(refreshToken);
      await events.patch({
        calendarId: 'primary',
        eventId,
        requestBody: {
          reminders: {
            useDefault: false,
            overrides: [{ method: 'popup', minutes }],
          },
        },
      });
      this.logger.log(`Reminder added to event ${eventId}`);
    } catch (error) {
      this.logger.error(`Failed to add reminder to event ${eventId}: ${handleError(error)}`);
      throw error;
    }
  }

  async getFreeBusyInfo(
    refreshToken: string,
    calendars: string[],
    timeMin?: string,
    timeMax?: string,
  ): Promise<calendar_v3.Schema$FreeBusyResponse> {
    try {
      const freebusy = this.getFreebusyResource(refreshToken);
      const res = await freebusy.query({
        requestBody: {
          timeMin,
          timeMax,
          items: calendars.map((calendarId) => ({ id: calendarId })),
        },
      });
      return res.data;
    } catch (error) {
      this.logger.error(`Failed to get free/busy info: ${handleError(error)}`);
      throw error;
    }
  }

  async addAttendee(
    refreshToken: string,
    eventId: string,
    attendee: calendar_v3.Schema$EventAttendee,
  ): Promise<calendar_v3.Schema$EventAttendee> {
    try {
      const events = this.getEventsResource(refreshToken);
      const res = await events.patch({
        calendarId: 'primary',
        eventId,
        requestBody: {
          attendees: [attendee],
        },
        fields: 'attendees',
      });
      this.logger.log(`Attendee added to event ${eventId}`);
      return res.data.attendees[0];
    } catch (error) {
      this.logger.error(`Failed to add attendee to event ${eventId}: ${handleError(error)}`);
      throw error;
    }
  }

  async removeAttendee(refreshToken: string, eventId: string, attendeeEmail: string): Promise<void> {
    try {
      const events = this.getEventsResource(refreshToken);
      const event = await events.get({
        calendarId: 'primary',
        eventId,
      });

      if (!event.data.attendees) {
        throw new Error('No attendees found for the event.');
      }

      const updatedAttendees = event.data.attendees.filter((attendee) => attendee.email !== attendeeEmail);

      await events.patch({
        calendarId: 'primary',
        eventId,
        requestBody: {
          attendees: updatedAttendees,
        },
      });
      this.logger.log(`Attendee ${attendeeEmail} removed from event ${eventId}`);
    } catch (error) {
      this.logger.error(`Failed to remove attendee ${attendeeEmail} from event ${eventId}: ${handleError(error)}`);
      throw error;
    }
  }
}
