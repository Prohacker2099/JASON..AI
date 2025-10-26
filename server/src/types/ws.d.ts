declare module "ws" {
  import { EventEmitter } from "events";
  import { IncomingMessage } from "http";
  import { Socket } from "net";

  export class WebSocket extends EventEmitter {
    constructor(address: string, options?: any);

    send(data: any, callback?: (err?: Error) => void): void;
    close(code?: number, reason?: string): void;

    on(event: "open", listener: () => void): this;
    on(event: "close", listener: (code: number, reason: string) => void): this;
    on(event: "error", listener: (error: Error) => void): this;
    on(event: "message", listener: (data: Buffer) => void): this;
    on(event: string, listener: (...args: any[]) => void): this;

    readyState: number;

    static readonly CONNECTING: number;
    static readonly OPEN: number;
    static readonly CLOSING: number;
    static readonly CLOSED: number;
  }
}
