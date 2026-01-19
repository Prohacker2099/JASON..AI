import { ConnectorProvider, type StoredToken } from '../ConnectorManager'
import axios from 'axios'

export class OutlookProvider implements ConnectorProvider {
  id = 'outlook'
  name = 'Outlook'

  getDefaultScopes(): string[] {
    return [
      'https://graph.microsoft.com/Mail.Read',
      'https://graph.microsoft.com/Mail.Send',
      'https://graph.microsoft/Mail.Write',
      'https://graph.microsoft/Calendars.ReadWrite',
      'https://graph.microsoft/Contacts.ReadWrite',
      'https://graph.microsoft/User.Read'
    ]
  }

  getAuthUrl(opts: { state: string; scopes?: string[] }): string {
    const scopes = opts.scopes || this.getDefaultScopes()
    const params = new URLSearchParams({
      client_id: process.env.OUTLOOK_CLIENT_ID || '',
      response_type: 'code',
      redirect_uri: process.env.OUTLOOK_REDIRECT_URI || 'http://localhost:3001/api/connectors/outlook/callback',
      scope: scopes.join(' '),
      state: opts.state,
      response_mode: 'query'
    })
    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`
  }

  async exchangeCode(code: string): Promise<StoredToken> {
    const data = new URLSearchParams({
      client_id: process.env.OUTLOOK_CLIENT_ID || '',
      client_secret: process.env.OUTLOOK_CLIENT_SECRET || '',
      code,
      redirect_uri: process.env.OUTLOOK_REDIRECT_URI || 'http://localhost:3001/api/connectors/outlook/callback',
      grant_type: 'authorization_code'
    })

    const resp = await axios.post('https://login.microsoftonline.com/common/oauth2/v2.0/token', data, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })

    if (!resp.data.access_token) {
      throw new Error(`Outlook OAuth failed: ${resp.data.error_description || resp.data.error || 'Unknown error'}`)
    }

    return {
      accessToken: resp.data.access_token,
      refreshToken: resp.data.refresh_token,
      tokenType: resp.data.token_type || 'Bearer',
      scope: resp.data.scope,
      expiresAt: resp.data.expires_in ? Date.now() + (resp.data.expires_in * 1000) : 0,
      raw: resp.data
    }
  }

  async refresh(refreshToken: string): Promise<StoredToken> {
    const data = new URLSearchParams({
      client_id: process.env.OUTLOOK_CLIENT_ID || '',
      client_secret: process.env.OUTLOOK_CLIENT_SECRET || '',
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })

    const resp = await axios.post('https://login.microsoftonline.com/common/oauth2/v2.0/token', data, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })

    if (!resp.data.access_token) {
      throw new Error(`Outlook refresh failed: ${resp.data.error_description || resp.data.error || 'Unknown error'}`)
    }

    return {
      accessToken: resp.data.access_token,
      refreshToken: resp.data.refresh_token || refreshToken,
      tokenType: resp.data.token_type || 'Bearer',
      scope: resp.data.scope,
      expiresAt: resp.data.expires_in ? Date.now() + (resp.data.expires_in * 1000) : 0,
      raw: resp.data
    }
  }

  async executeOperation(token: StoredToken, operation: string, params: any): Promise<any> {
    const headers = {
      Authorization: `Bearer ${token.accessToken}`,
      'Content-Type': 'application/json'
    }

    switch (operation) {
      case 'sendEmail':
        const emailPayload = {
          message: {
            subject: params.subject,
            body: {
              contentType: params.contentType || 'HTML',
              content: params.body
            },
            toRecipients: params.toRecipients?.map(email => ({ emailAddress: { address: email } })) || [],
            ccRecipients: params.ccRecipients?.map(email => ({ emailAddress: { address: email } })) || [],
            bccRecipients: params.bccRecipients?.map(email => ({ emailAddress: { address: email } })) || [],
            attachments: params.attachments || []
          }
        }

        const sendResp = await axios.post(
          'https://graph.microsoft.com/v1.0/me/sendMail',
          emailPayload,
          { headers }
        )

        return sendResp.data

      case 'getMessages':
        const messagesResp = await axios.get(
          'https://graph.microsoft.com/v1.0/me/messages',
          {
            headers,
            params: {
              $top: params.limit || 25,
              $select: 'subject,from,toRecipients,body,receivedDateTime,hasAttachments',
              $orderby: 'receivedDateTime desc',
              ...params.options
            }
          }
        )
        return messagesResp.data

      case 'searchMessages':
        const searchResp = await axios.get(
          'https://graph.microsoft.com/v1.0/me/messages',
          {
            headers,
            params: {
              $search: `"${params.query}"`,
              $top: params.limit || 25,
              $select: 'subject,from,toRecipients,body,receivedDateTime,hasAttachments',
              ...params.options
            }
          }
        )
        return searchResp.data

      case 'createEvent':
        const eventPayload = {
          subject: params.subject,
          body: {
            contentType: params.contentType || 'HTML',
            content: params.body
          },
          start: {
            dateTime: params.startDateTime,
            timeZone: params.timeZone || 'UTC'
          },
          end: {
            dateTime: params.endDateTime,
            timeZone: params.timeZone || 'UTC'
          },
          location: params.location ? { displayName: params.location } : undefined,
          attendees: params.attendees?.map(email => ({
            emailAddress: { address: email },
            type: 'required'
          })) || [],
          ...params.options
        }

        const eventResp = await axios.post(
          'https://graph.microsoft.com/v1.0/me/events',
          eventPayload,
          { headers }
        )
        return eventResp.data

      case 'getEvents':
        const eventsResp = await axios.get(
          'https://graph.microsoft.com/v1.0/me/calendar/events',
          {
            headers,
            params: {
              $top: params.limit || 25,
              $select: 'subject,start,end,location,body',
              $orderby: 'start/dateTime',
              ...params.options
            }
          }
        )
        return eventsResp.data

      case 'getContacts':
        const contactsResp = await axios.get(
          'https://graph.microsoft.com/v1.0/me/contacts',
          {
            headers,
            params: {
              $top: params.limit || 50,
              $select: 'displayName,emailAddresses,phoneNumbers',
              ...params.options
            }
          }
        )
        return contactsResp.data

      case 'createContact':
        const contactPayload = {
          displayName: params.displayName,
          emailAddresses: params.emailAddresses?.map(email => ({ address: email })) || [],
          phoneNumbers: params.phoneNumbers?.map(phone => ({ number: phone })) || [],
          ...params.options
        }

        const contactResp = await axios.post(
          'https://graph.microsoft.com/v1.0/me/contacts',
          contactPayload,
          { headers }
        )
        return contactResp.data

      default:
        throw new Error(`Unsupported Outlook operation: ${operation}`)
    }
  }
}
