import { ConnectorProvider, type StoredToken } from '../ConnectorManager'
import axios from 'axios'

export class SlackProvider implements ConnectorProvider {
  id = 'slack'
  name = 'Slack'

  getDefaultScopes(): string[] {
    return [
      'channels:read',
      'channels:write',
      'chat:write',
      'users:read',
      'files:write',
      'files:read'
    ]
  }

  getAuthUrl(opts: { state: string; scopes?: string[] }): string {
    const scopes = opts.scopes || this.getDefaultScopes()
    const params = new URLSearchParams({
      client_id: process.env.SLACK_CLIENT_ID || '',
      redirect_uri: process.env.SLACK_REDIRECT_URI || 'http://localhost:3001/api/connectors/slack/callback',
      scope: scopes.join(' '),
      state: opts.state,
      response_type: 'code'
    })
    return `https://slack.com/oauth/v2/authorize?${params.toString()}`
  }

  async exchangeCode(code: string): Promise<StoredToken> {
    const resp = await axios.post('https://slack.com/api/oauth.v2.access', null, {
      params: {
        client_id: process.env.SLACK_CLIENT_ID,
        client_secret: process.env.SLACK_CLIENT_SECRET,
        code,
        redirect_uri: process.env.SLACK_REDIRECT_URI || 'http://localhost:3001/api/connectors/slack/callback'
      }
    })

    if (!resp.data.ok) {
      throw new Error(`Slack OAuth failed: ${resp.data.error}`)
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
    const resp = await axios.post('https://slack.com/api/oauth.v2.access', null, {
      params: {
        client_id: process.env.SLACK_CLIENT_ID,
        client_secret: process.env.SLACK_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      }
    })

    if (!resp.data.ok) {
      throw new Error(`Slack refresh failed: ${resp.data.error}`)
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
      case 'sendMessage':
        const msgResp = await axios.post('https://slack.com/api/chat.postMessage', {
          channel: params.channel,
          text: params.text,
          ...params.options
        }, { headers })
        
        if (!msgResp.data.ok) {
          throw new Error(`Slack sendMessage failed: ${msgResp.data.error}`)
        }
        return msgResp.data

      case 'getChannels':
        const channelsResp = await axios.get('https://slack.com/api/conversations.list', {
          headers,
          params: { types: 'public_channel,private_channel' }
        })
        
        if (!channelsResp.data.ok) {
          throw new Error(`Slack getChannels failed: ${channelsResp.data.error}`)
        }
        return channelsResp.data.channels

      case 'getMessages':
        const messagesResp = await axios.get('https://slack.com/api/conversations.history', {
          headers,
          params: {
            channel: params.channel,
            limit: params.limit || 100,
            ...params.options
          }
        })
        
        if (!messagesResp.data.ok) {
          throw new Error(`Slack getMessages failed: ${messagesResp.data.error}`)
        }
        return messagesResp.data.messages

      case 'uploadFile':
        const formData = new FormData()
        formData.append('channels', params.channel)
        formData.append('file', params.file)
        if (params.title) formData.append('title', params.title)
        if (params.initial_comment) formData.append('initial_comment', params.initial_comment)

        const uploadResp = await axios.post('https://slack.com/api/files.upload', formData, {
          headers: {
            Authorization: `Bearer ${token.accessToken}`
          }
        })

        if (!uploadResp.data.ok) {
          throw new Error(`Slack uploadFile failed: ${uploadResp.data.error}`)
        }
        return uploadResp.data

      case 'createChannel':
        const createResp = await axios.post('https://slack.com/api/conversations.create', {
          name: params.name,
          is_private: params.isPrivate || false,
          ...params.options
        }, { headers })

        if (!createResp.data.ok) {
          throw new Error(`Slack createChannel failed: ${createResp.data.error}`)
        }
        return createResp.data

      default:
        throw new Error(`Unsupported Slack operation: ${operation}`)
    }
  }
}
