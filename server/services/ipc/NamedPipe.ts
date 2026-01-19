import net from 'net'
import os from 'os'
import { EventEmitter } from 'events'
import { personaEngine } from '../agent/PersonaEngine'

export type IPCStatus = { running: boolean; path: string; clients: number }

class NamedPipeServer extends EventEmitter {
  private server: net.Server | null = null
  private clients = new Set<net.Socket>()
  private pipePath = this.defaultPath()

  private defaultPath(): string {
    return process.platform === 'win32' ? '\\\\.\\pipe\\jason_ipc' : '/tmp/jason_ipc.sock'
  }

  status(): IPCStatus { return { running: !!this.server, path: this.pipePath, clients: this.clients.size } }

  start(path?: string): IPCStatus {
    if (this.server) return this.status()
    this.pipePath = String(path || this.defaultPath())
    try { if (os.platform() !== 'win32') { try { require('fs').unlinkSync(this.pipePath) } catch {} } } catch {}
    this.server = net.createServer((socket) => {
      this.clients.add(socket)
      socket.setEncoding('utf8')
      socket.on('data', (chunk) => this.onData(socket, chunk))
      socket.on('close', () => { this.clients.delete(socket) })
      socket.on('error', () => { this.clients.delete(socket) })
    })
    this.server.on('error', (e) => { this.emit('error', e) })
    this.server.listen(this.pipePath, () => { this.emit('started', this.status()) })
    return this.status()
  }

  stop(): IPCStatus {
    if (this.server) {
      try { this.server.close() } catch {}
      this.server = null
    }
    for (const c of Array.from(this.clients)) { try { c.destroy() } catch {} }
    this.clients.clear()
    return this.status()
  }

  broadcast(msg: any) {
    const line = JSON.stringify(msg) + '\n'
    for (const c of this.clients) { try { c.write(line) } catch {} }
  }

  private async onData(_socket: net.Socket, chunk: Buffer | string) {
    const str = typeof chunk === 'string' ? chunk : (chunk ? chunk.toString('utf8') : '')
    const lines = String(str || '').split(/\r?\n/).filter(Boolean)
    for (const ln of lines) {
      try {
        const msg = JSON.parse(ln)
        if (msg && msg.type === 'PERCEPT') {
          await personaEngine.ingestPercept(msg)
        } else if (msg && msg.type === 'ACTION') {
          // Future: route external ACTIONs to orchestrator/DAI
          this.emit('action', msg)
        }
      } catch {}
    }
  }
}

export const ipcServer = new NamedPipeServer()
