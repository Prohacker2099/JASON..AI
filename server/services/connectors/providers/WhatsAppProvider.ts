import { ConnectorProvider, type StoredToken } from '../ConnectorManager'
import axios from 'axios'
import * as crypto from 'crypto'

export class WhatsAppProvider implements ConnectorProvider {
  id = 'whatsapp'
  name = 'WhatsApp'

  getDefaultScopes(): string[] {
    return [
      'whatsapp_business_management',
      'whatsapp_business_messaging'
    ]
  }

  getAuthUrl(opts: { state: string; scopes?: string[] }): string {
    const scopes = opts.scopes || this.getDefaultScopes()
    const params = new URLSearchParams({
      client_id: process.env.WHATSAPP_CLIENT_ID || '',
      redirect_uri: process.env.WHATSAPP_REDIRECT_URI || 'http://localhost:3001/api/connectors/whatsapp/callback',
      scope: scopes.join(' '),
      state: opts.state,
      response_type: 'code'
    })
    return `https://graph.facebook.com/v18.0/oauth/authorize?${params.toString()}`
  }

  async exchangeCode(code: string): Promise<StoredToken> {
    const resp = await axios.post('https://graph.facebook.com/v18.0/oauth/access_token', null, {
      params: {
        client_id: process.env.WHATSAPP_CLIENT_ID,
        client_secret: process.env.WHATSAPP_CLIENT_SECRET,
        code,
        redirect_uri: process.env.WHATSAPP_REDIRECT_URI || 'http://localhost:3001/api/connectors/whatsapp/callback'
      }
    })

    if (!resp.data.access_token) {
      throw new Error(`WhatsApp OAuth failed: ${resp.data.error?.message || 'Unknown error'}`)
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
    const resp = await axios.post('https://graph.facebook.com/v18.0/oauth/access_token', null, {
      params: {
        client_id: process.env.WHATSAPP_CLIENT_ID,
        client_secret: process.env.WHATSAPP_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      }
    })

    if (!resp.data.access_token) {
      throw new Error(`WhatsApp refresh failed: ${resp.data.error?.message || 'Unknown error'}`)
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

    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

    switch (operation) {
      case 'sendMessage':
        if (!phoneNumberId) {
          throw new Error('WhatsApp phone number ID not configured')
        }

        const messagePayload = {
          messaging_product: 'whatsapp',
          to: params.to,
          type: params.type || 'text',
          ...params.content
        }

        const msgResp = await axios.post(
          `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
          messagePayload,
          { headers }
        )

        if (resp.data.error) {
          throw new Error(`WhatsApp sendMessage failed: ${resp.data.error.message}`)
        }
        return resp.data

      case 'getMessages':
        if (!phoneNumberId) {
          throw new Error('WhatsApp phone number ID not configured')
        }

        const messagesResp = await axios.get(
          `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
          {
            headers,
            params: {
              limit: params.limit || 100,
              ...params.options
            }
          }
        )

        if (messagesResp.data.error) {
          throw new Error(`WhatsApp getMessages failed: ${messagesResp.data.error.message}`)
        }
        return messagesResp.data

      case 'uploadMedia':
        if (!phoneNumberId) {
          throw new Error('WhatsApp phone number ID not configured')
        }

        const formData = new FormData()
        formData.append('file', params.file)
        formData.append('messaging_product', 'whatsapp')
        if (params.type) formData.append('type', params.type)

        const uploadResp = await axios.post(
          `https://graph.facebook.com/v18.0/${phoneNumberId}/media`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token.accessToken}`
            }
          }
        )

        if (uploadResp.data.error) {
          throw new Error(`WhatsApp uploadMedia failed: ${uploadResp.data.error.message}`)
        }
        return uploadResp.data

      case 'createTemplate':
        const templatePayload = {
          name: params.name,
          category: params.category,
          language: params.language,
          components: params.components
        }

        const templateResp = await axios.post(
          `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates`,
          templatePayload,
          { headers }
        )

        if (templateResp.data.error) {
          throw new Error(`WhatsApp createTemplate failed: ${templateResp.data.error.message}`)
        }
        return templateResp.data

      case 'getAccountInfo':
        const accountResp = await axios.get(
          `https://graph.facebook.com/v18.0/${phoneNumberId}`,
          { headers }
        )

        if (accountResp.data.error) {
          throw new Error(`WhatsApp getAccountInfo failed: ${accountResp.data.error.message}`)
        }
        return accountResp.data

      default:
        throw new Error(`Unsupported WhatsApp operation: ${operation}`)
    }
  }
}
