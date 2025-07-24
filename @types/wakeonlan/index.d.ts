/**
 * Type definitions for wakeonlan 0.1.0
 * Project: https://github.com/agnat/node_wake_on_lan
 */

declare module "wakeonlan" {
  /**
   * Send a Wake-on-LAN magic packet to a MAC address
   * @param mac The MAC address of the target device
   * @param options Optional configuration
   * @param callback Optional callback function
   */
  function wake(
    mac: string,
    options?: {
      address?: string;
      port?: number;
    },
    callback?: (error: Error | null) => void,
  ): void;

  export = wake;
}
