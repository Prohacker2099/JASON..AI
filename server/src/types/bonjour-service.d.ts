declare module "bonjour-service" {
  export interface BonjourOptions {
    type?: string;
    protocol?: string;
    subtypes?: string[];
    txt?: Record<string, string>;
    port?: number;
    host?: string;
    interface?: string;
    multicast?: boolean;
    probe?: boolean;
  }

  export interface BonjourService {
    name: string;
    type: string;
    host: string;
    port: number;
    fqdn: string;
    protocol: string;
    addresses: string[];
    txt?: Record<string, string>;
    subtypes: string[];
    referer?: Record<string, any>;
  }

  export interface BonjourServiceBrowser {
    services: BonjourService[];
    start(): void;
    stop(): void;
    update(): void;
    on(event: "up" | "down", listener: (service: BonjourService) => void): this;
    removeListener(event: string, listener: Function): this;
  }

  export interface BonjourServicePublisher {
    name: string;
    type: string;
    host: string;
    port: number;
    fqdn: string;
    protocol: string;
    addresses: string[];
    txt?: Record<string, string>;
    subtypes: string[];
    start(): void;
    stop(): void;
    on(event: string, listener: Function): this;
    removeListener(event: string, listener: Function): this;
  }

  export interface BonjourInstance {
    publish(options: BonjourOptions): BonjourServicePublisher;
    unpublishAll(): void;
    find(options?: BonjourOptions): BonjourServiceBrowser;
    findOne(options?: BonjourOptions): Promise<BonjourService>;
    destroy(): void;
  }

  export { function } bonjour(options?: {
    interface?: string;
    multicast?: boolean;
    port?: number;
  }): BonjourInstance;
}
