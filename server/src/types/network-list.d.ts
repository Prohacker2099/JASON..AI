declare module "network-list" {
  export interface NetworkDevice {
    ip: string;
    mac?: string;
    vendor?: string;
    alive?: boolean;
  }

  export function scan(options?: {
    range?: string[];
    vendor?: boolean;
    timeout?: number;
  }): Promise<NetworkDevice[]>;
}
