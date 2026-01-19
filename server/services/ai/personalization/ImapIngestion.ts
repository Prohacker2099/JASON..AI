import { EventEmitter } from 'events'
import Imap from 'imap'
import { simpleParser } from 'mailparser'
import { usptEngine } from './USPT'
import fs from 'fs/promises'
import path from 'path'

export interface ImapConfig {
    user: string
    password?: string
    host: string
    port: number
    tls: boolean
    mailbox: string
    markAsRead: boolean
}

export class ImapIngestion extends EventEmitter {
    private config: ImapConfig
    private imap: Imap | null = null
    private isProcessing = false

    constructor(config: ImapConfig) {
        super()
        this.config = config
    }

    async connect(): Promise<void> {
        if (this.imap) return

        this.imap = new Imap({
            user: this.config.user,
            password: this.config.password || process.env.IMAP_PASSWORD,
            host: this.config.host,
            port: this.config.port,
            tls: this.config.tls,
            tlsOptions: { rejectUnauthorized: false }
        })

        this.imap.once('ready', () => {
            this.emit('ready')
            this.openBox()
        })

        this.imap.once('error', (err: Error) => {
            this.emit('error', err)
        })

        this.imap.once('end', () => {
            this.emit('end')
            this.imap = null
        })

        this.imap.connect()
    }

    private openBox(): void {
        if (!this.imap) return

        this.imap.openBox(this.config.mailbox, false, (err, box) => {
            if (err) {
                this.emit('error', err)
                return
            }
            this.emit('box_opened', box)
            this.startPolling()
        })
    }

    private startPolling(): void {
        // Poll every 5 minutes
        setInterval(() => {
            this.fetchNewEmails()
        }, 5 * 60 * 1000)

        // Also fetch immediately
        this.fetchNewEmails()
    }

    private fetchNewEmails(): void {
        if (!this.imap || this.isProcessing) return

        this.isProcessing = true
        this.imap.search(['UNSEEN'], (err, results) => {
            if (err) {
                this.emit('error', err)
                this.isProcessing = false
                return
            }

            if (!results || results.length === 0) {
                this.isProcessing = false
                return
            }

            const f = this.imap!.fetch(results, {
                bodies: '',
                markSeen: this.config.markAsRead
            })

            f.on('message', (msg, seqno) => {
                msg.on('body', (stream, info) => {
                    simpleParser(stream, async (err, parsed) => {
                        if (err) {
                            this.emit('error', err)
                            return
                        }

                        const content = parsed.text || parsed.html || ''
                        if (content) {
                            await usptEngine.ingestTextSample(content, 'email', {
                                subject: parsed.subject,
                                from: parsed.from?.text,
                                date: parsed.date
                            })
                            this.emit('email_ingested', { seqno, subject: parsed.subject })
                        }
                    })
                })
            })

            f.once('error', (err) => {
                this.emit('error', err)
            })

            f.once('end', () => {
                this.isProcessing = false
            })
        })
    }

    async shutdown(): Promise<void> {
        if (this.imap) {
            this.imap.end()
        }
    }
}

// In production, instantiate this with env vars
export const imapIngestion = process.env.IMAP_USER ? new ImapIngestion({
    user: process.env.IMAP_USER,
    host: process.env.IMAP_HOST || 'imap.gmail.com',
    port: parseInt(process.env.IMAP_PORT || '993'),
    tls: true,
    mailbox: 'INBOX',
    markAsRead: false
}) : null
