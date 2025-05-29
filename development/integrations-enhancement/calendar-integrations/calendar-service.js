/**
 * Universal Calendar Integration Service
 * 
 * Provides unified interface for Google Calendar, Outlook, and iCal
 * schedule synchronization with conflict detection and resolution.
 */

const { google } = require('googleapis');
const { Client } = require('@microsoft/microsoft-graph-client');
const ical = require('ical-generator');
const axios = require('axios');
const EventEmitter = require('events');
const logger = require('../../../backend/utils/logger');

class CalendarIntegrationService extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      google: {
        clientId: config.google?.clientId || process.env.GOOGLE_CLIENT_ID,
        clientSecret: config.google?.clientSecret || process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: config.google?.redirectUri || process.env.GOOGLE_REDIRECT_URI,
        scopes: ['https://www.googleapis.com/auth/calendar']
      },
      outlook: {
        clientId: config.outlook?.clientId || process.env.OUTLOOK_CLIENT_ID,
        clientSecret: config.outlook?.clientSecret || process.env.OUTLOOK_CLIENT_SECRET,
        redirectUri: config.outlook?.redirectUri || process.env.OUTLOOK_REDIRECT_URI,
        scopes: ['https://graph.microsoft.com/calendars.readwrite']
      },
      defaultTimezone: config.defaultTimezone || 'America/Chicago',
      conflictDetection: config.conflictDetection !== false,
      autoResolveConflicts: config.autoResolveConflicts || false,
      ...config
    };

    this.googleAuth = null;
    this.outlookClient = null;
    this.userTokens = new Map(); // Store user authentication tokens
    this.conflictResolvers = new Map();
    
    this.initializeProviders();
  }

  /**
   * Initialize calendar service providers
   */
  initializeProviders() {
    // Initialize Google Calendar
    if (this.config.google.clientId) {
      this.googleAuth = new google.auth.OAuth2(
        this.config.google.clientId,
        this.config.google.clientSecret,
        this.config.google.redirectUri
      );
    }

    // Initialize Microsoft Graph for Outlook
    if (this.config.outlook.clientId) {
      // Microsoft Graph client will be initialized per user with their tokens
    }
  }

  /**
   * Generate authentication URL for a calendar provider
   */
  getAuthUrl(provider, userId, state = null) {
    switch (provider.toLowerCase()) {
      case 'google':
        if (!this.googleAuth) throw new Error('Google Calendar not configured');
        
        const googleState = state || `google_${userId}_${Date.now()}`;
        return this.googleAuth.generateAuthUrl({
          access_type: 'offline',
          scope: this.config.google.scopes,
          state: googleState,
          prompt: 'consent'
        });

      case 'outlook':
        if (!this.config.outlook.clientId) throw new Error('Outlook Calendar not configured');
        
        const outlookState = state || `outlook_${userId}_${Date.now()}`;
        const baseUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
        const params = new URLSearchParams({
          client_id: this.config.outlook.clientId,
          response_type: 'code',
          redirect_uri: this.config.outlook.redirectUri,
          scope: this.config.outlook.scopes.join(' '),
          state: outlookState,
          response_mode: 'query'
        });
        
        return `${baseUrl}?${params.toString()}`;

      default:
        throw new Error(`Unsupported calendar provider: ${provider}`);
    }
  }

  /**
   * Exchange authorization code for access tokens
   */
  async exchangeCodeForTokens(provider, code, userId) {
    try {
      switch (provider.toLowerCase()) {
        case 'google':
          const { tokens } = await this.googleAuth.getToken(code);
          this.userTokens.set(`google_${userId}`, {
            provider: 'google',
            tokens,
            userId,
            expiresAt: tokens.expiry_date,
            createdAt: Date.now()
          });
          
          return { success: true, provider: 'google', userId };

        case 'outlook':
          const tokenResponse = await axios.post(
            'https://login.microsoftonline.com/common/oauth2/v2.0/token',
            new URLSearchParams({
              client_id: this.config.outlook.clientId,
              client_secret: this.config.outlook.clientSecret,
              code,
              redirect_uri: this.config.outlook.redirectUri,
              grant_type: 'authorization_code'
            }),
            {
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            }
          );

          const outlookTokens = tokenResponse.data;
          this.userTokens.set(`outlook_${userId}`, {
            provider: 'outlook',
            tokens: outlookTokens,
            userId,
            expiresAt: Date.now() + (outlookTokens.expires_in * 1000),
            createdAt: Date.now()
          });

          return { success: true, provider: 'outlook', userId };

        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }
    } catch (error) {
      logger.error(`Token exchange failed for ${provider}:`, error);
      throw error;
    }
  }

  /**
   * Get authenticated client for a user and provider
   */
  async getAuthenticatedClient(provider, userId) {
    const tokenKey = `${provider}_${userId}`;
    const tokenData = this.userTokens.get(tokenKey);
    
    if (!tokenData) {
      throw new Error(`No authentication found for ${provider} user ${userId}`);
    }

    // Check if token needs refresh
    if (tokenData.expiresAt && Date.now() > tokenData.expiresAt - 300000) { // 5 min buffer
      await this.refreshTokens(provider, userId);
    }

    switch (provider.toLowerCase()) {
      case 'google':
        const googleAuth = new google.auth.OAuth2(
          this.config.google.clientId,
          this.config.google.clientSecret,
          this.config.google.redirectUri
        );
        googleAuth.setCredentials(tokenData.tokens);
        return google.calendar({ version: 'v3', auth: googleAuth });

      case 'outlook':
        return Client.init({
          authProvider: {
            getAccessToken: async () => {
              return tokenData.tokens.access_token;
            }
          }
        });

      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  /**
   * Refresh expired tokens
   */
  async refreshTokens(provider, userId) {
    const tokenKey = `${provider}_${userId}`;
    const tokenData = this.userTokens.get(tokenKey);
    
    if (!tokenData || !tokenData.tokens.refresh_token) {
      throw new Error('No refresh token available');
    }

    try {
      switch (provider.toLowerCase()) {
        case 'google':
          this.googleAuth.setCredentials(tokenData.tokens);
          const { credentials } = await this.googleAuth.refreshAccessToken();
          
          tokenData.tokens = credentials;
          tokenData.expiresAt = credentials.expiry_date;
          this.userTokens.set(tokenKey, tokenData);
          break;

        case 'outlook':
          const response = await axios.post(
            'https://login.microsoftonline.com/common/oauth2/v2.0/token',
            new URLSearchParams({
              client_id: this.config.outlook.clientId,
              client_secret: this.config.outlook.clientSecret,
              refresh_token: tokenData.tokens.refresh_token,
              grant_type: 'refresh_token'
            }),
            {
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            }
          );

          const newTokens = response.data;
          tokenData.tokens = newTokens;
          tokenData.expiresAt = Date.now() + (newTokens.expires_in * 1000);
          this.userTokens.set(tokenKey, tokenData);
          break;
      }
      
      logger.info(`Tokens refreshed for ${provider} user ${userId}`);
    } catch (error) {
      logger.error(`Token refresh failed for ${provider}:`, error);
      throw error;
    }
  }

  /**
   * Sync FlexTime schedule to external calendar
   */
  async syncScheduleToCalendar(provider, userId, schedules, calendarId = 'primary') {
    try {
      const client = await this.getAuthenticatedClient(provider, userId);
      const results = { created: 0, updated: 0, failed: 0, conflicts: [] };

      for (const schedule of schedules) {
        try {
          const event = this.transformScheduleToCalendarEvent(schedule);
          
          // Check for conflicts if enabled
          if (this.config.conflictDetection) {
            const conflicts = await this.detectConflicts(provider, userId, event, calendarId);
            if (conflicts.length > 0) {
              results.conflicts.push({
                schedule,
                conflicts,
                resolved: false
              });
              
              if (this.config.autoResolveConflicts) {
                // Attempt automatic conflict resolution
                const resolved = await this.resolveConflicts(provider, userId, event, conflicts);
                if (resolved) {
                  results.conflicts[results.conflicts.length - 1].resolved = true;
                } else {
                  results.failed++;
                  continue;
                }
              } else {
                results.failed++;
                continue;
              }
            }
          }

          // Create calendar event
          const createdEvent = await this.createCalendarEvent(provider, client, event, calendarId);
          
          if (createdEvent) {
            results.created++;
            
            // Store mapping for future updates
            await this.storeEventMapping(schedule.id, provider, userId, createdEvent.id);
          } else {
            results.failed++;
          }
          
        } catch (error) {
          logger.error(`Failed to sync schedule ${schedule.id}:`, error);
          results.failed++;
        }
      }

      logger.info(`Schedule sync to ${provider} complete:`, results);
      return results;
      
    } catch (error) {
      logger.error(`Calendar sync failed for ${provider}:`, error);
      throw error;
    }
  }

  /**
   * Transform FlexTime schedule to calendar event format
   */
  transformScheduleToCalendarEvent(schedule) {
    const startTime = new Date(schedule.dateTime);
    const endTime = new Date(startTime.getTime() + (schedule.duration || 180) * 60000); // Default 3 hours

    return {
      summary: `${schedule.homeTeam} vs ${schedule.awayTeam}`,
      description: this.generateEventDescription(schedule),
      location: schedule.venue || schedule.location,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: schedule.timezone || this.config.defaultTimezone
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: schedule.timezone || this.config.defaultTimezone
      },
      attendees: this.generateAttendees(schedule),
      extendedProperties: {
        private: {
          flextimeId: schedule.id,
          sport: schedule.sport,
          isConferenceGame: schedule.isConferenceGame?.toString(),
          homeTeam: schedule.homeTeam,
          awayTeam: schedule.awayTeam
        }
      }
    };
  }

  /**
   * Generate event description
   */
  generateEventDescription(schedule) {
    let description = `${schedule.sport} Game\n\n`;
    description += `Home: ${schedule.homeTeam}\n`;
    description += `Away: ${schedule.awayTeam}\n`;
    
    if (schedule.venue) {
      description += `Venue: ${schedule.venue}\n`;
    }
    
    if (schedule.tvNetwork) {
      description += `TV: ${schedule.tvNetwork}\n`;
    }
    
    if (schedule.isConferenceGame) {
      description += `Conference Game: Yes\n`;
    }
    
    if (schedule.week) {
      description += `Week: ${schedule.week}\n`;
    }
    
    description += `\nGenerated by FlexTime Scheduling System`;
    
    return description;
  }

  /**
   * Generate attendees for calendar event
   */
  generateAttendees(schedule) {
    const attendees = [];
    
    // Add team contacts if available
    if (schedule.homeTeamContacts) {
      schedule.homeTeamContacts.forEach(contact => {
        attendees.push({
          email: contact.email,
          displayName: contact.name,
          optional: true
        });
      });
    }
    
    if (schedule.awayTeamContacts) {
      schedule.awayTeamContacts.forEach(contact => {
        attendees.push({
          email: contact.email,
          displayName: contact.name,
          optional: true
        });
      });
    }
    
    return attendees;
  }

  /**
   * Create calendar event using provider-specific API
   */
  async createCalendarEvent(provider, client, event, calendarId) {
    switch (provider.toLowerCase()) {
      case 'google':
        const googleEvent = await client.events.insert({
          calendarId,
          requestBody: event
        });
        return googleEvent.data;

      case 'outlook':
        const outlookEvent = await client.api(`/me/calendars/${calendarId}/events`).post({
          subject: event.summary,
          body: {
            contentType: 'Text',
            content: event.description
          },
          start: {
            dateTime: event.start.dateTime,
            timeZone: event.start.timeZone
          },
          end: {
            dateTime: event.end.dateTime,
            timeZone: event.end.timeZone
          },
          location: {
            displayName: event.location
          },
          attendees: event.attendees?.map(attendee => ({
            emailAddress: {
              address: attendee.email,
              name: attendee.displayName
            },
            type: attendee.optional ? 'optional' : 'required'
          }))
        });
        return outlookEvent;

      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  /**
   * Detect scheduling conflicts
   */
  async detectConflicts(provider, userId, event, calendarId) {
    try {
      const client = await this.getAuthenticatedClient(provider, userId);
      const conflicts = [];
      
      // Query for existing events during the same time period
      const startTime = new Date(event.start.dateTime);
      const endTime = new Date(event.end.dateTime);
      
      let existingEvents = [];
      
      switch (provider.toLowerCase()) {
        case 'google':
          const googleResponse = await client.events.list({
            calendarId,
            timeMin: startTime.toISOString(),
            timeMax: endTime.toISOString(),
            singleEvents: true,
            orderBy: 'startTime'
          });
          existingEvents = googleResponse.data.items || [];
          break;

        case 'outlook':
          const outlookResponse = await client
            .api(`/me/calendars/${calendarId}/events`)
            .filter(`start/dateTime ge '${startTime.toISOString()}' and end/dateTime le '${endTime.toISOString()}'`)
            .get();
          existingEvents = outlookResponse.value || [];
          break;
      }
      
      // Check for time overlaps
      existingEvents.forEach(existing => {
        const existingStart = new Date(existing.start?.dateTime || existing.start?.date);
        const existingEnd = new Date(existing.end?.dateTime || existing.end?.date);
        
        if (this.hasTimeOverlap(startTime, endTime, existingStart, existingEnd)) {
          conflicts.push({
            existingEvent: existing,
            overlapType: this.getOverlapType(startTime, endTime, existingStart, existingEnd)
          });
        }
      });
      
      return conflicts;
      
    } catch (error) {
      logger.error('Conflict detection failed:', error);
      return [];
    }
  }

  /**
   * Check if two time periods overlap
   */
  hasTimeOverlap(start1, end1, start2, end2) {
    return start1 < end2 && end1 > start2;
  }

  /**
   * Determine type of overlap
   */
  getOverlapType(start1, end1, start2, end2) {
    if (start1 <= start2 && end1 >= end2) return 'complete';
    if (start1 >= start2 && end1 <= end2) return 'contained';
    if (start1 < start2 && end1 > start2) return 'partial-end';
    if (start1 < end2 && end1 > end2) return 'partial-start';
    return 'unknown';
  }

  /**
   * Attempt to resolve scheduling conflicts
   */
  async resolveConflicts(provider, userId, event, conflicts) {
    // Implementation would depend on business rules
    // For now, just log the conflicts
    logger.warn(`Found ${conflicts.length} conflicts for event: ${event.summary}`);
    conflicts.forEach(conflict => {
      logger.warn(`Conflict with: ${conflict.existingEvent.summary} (${conflict.overlapType})`);
    });
    
    return false; // No automatic resolution implemented yet
  }

  /**
   * Store mapping between FlexTime schedule and calendar event
   */
  async storeEventMapping(scheduleId, provider, userId, eventId) {
    // This would typically store in a database
    // For now, we'll use an in-memory map
    if (!this.eventMappings) {
      this.eventMappings = new Map();
    }
    
    this.eventMappings.set(scheduleId, {
      provider,
      userId,
      eventId,
      createdAt: Date.now()
    });
  }

  /**
   * Generate iCal format for schedule export
   */
  generateICalendar(schedules, calendarName = 'FlexTime Schedule') {
    const cal = ical({
      domain: 'flextime.app',
      name: calendarName,
      description: 'Athletic schedule generated by FlexTime',
      timezone: this.config.defaultTimezone
    });

    schedules.forEach(schedule => {
      const startTime = new Date(schedule.dateTime);
      const endTime = new Date(startTime.getTime() + (schedule.duration || 180) * 60000);

      cal.createEvent({
        start: startTime,
        end: endTime,
        summary: `${schedule.homeTeam} vs ${schedule.awayTeam}`,
        description: this.generateEventDescription(schedule),
        location: schedule.venue || schedule.location,
        uid: `flextime-${schedule.id}@flextime.app`,
        categories: [schedule.sport, schedule.isConferenceGame ? 'Conference' : 'Non-Conference']
      });
    });

    return cal.toString();
  }

  /**
   * Get user's connected calendars
   */
  async getUserCalendars(provider, userId) {
    try {
      const client = await this.getAuthenticatedClient(provider, userId);
      
      switch (provider.toLowerCase()) {
        case 'google':
          const googleResponse = await client.calendarList.list();
          return googleResponse.data.items?.map(cal => ({
            id: cal.id,
            name: cal.summary,
            description: cal.description,
            primary: cal.primary,
            accessRole: cal.accessRole
          })) || [];

        case 'outlook':
          const outlookResponse = await client.api('/me/calendars').get();
          return outlookResponse.value?.map(cal => ({
            id: cal.id,
            name: cal.name,
            description: cal.description,
            primary: cal.isDefaultCalendar,
            color: cal.color
          })) || [];

        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }
    } catch (error) {
      logger.error(`Failed to get calendars for ${provider}:`, error);
      throw error;
    }
  }

  /**
   * Remove user authentication
   */
  async disconnectUser(provider, userId) {
    const tokenKey = `${provider}_${userId}`;
    this.userTokens.delete(tokenKey);
    
    // Also revoke tokens if possible
    try {
      const tokenData = this.userTokens.get(tokenKey);
      if (tokenData) {
        switch (provider.toLowerCase()) {
          case 'google':
            await axios.post(`https://oauth2.googleapis.com/revoke?token=${tokenData.tokens.access_token}`);
            break;
          case 'outlook':
            // Microsoft Graph doesn't have a direct revoke endpoint
            // The token will expire naturally
            break;
        }
      }
    } catch (error) {
      logger.warn(`Failed to revoke tokens for ${provider}:`, error);
    }
    
    return { success: true, provider, userId };
  }

  /**
   * Get service status and statistics
   */
  getStatus() {
    return {
      connectedUsers: this.userTokens.size,
      providers: {
        google: !!this.config.google.clientId,
        outlook: !!this.config.outlook.clientId
      },
      conflictDetection: this.config.conflictDetection,
      autoResolveConflicts: this.config.autoResolveConflicts
    };
  }
}

module.exports = CalendarIntegrationService;