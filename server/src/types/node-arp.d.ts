declare module "node-arp" {
  /**
   * Get the MAC address for an IP address
   * @param ipAddress The IP address to look up
   * @param callback Callback function with error and MAC address
   */
  export function getMAC(
    ipAddress: string,
    callback: (err: Error | null, mac: string | null) => void,
  ): void;

  /**
   * Get the MAC table (ARP table)
   * @param callback Callback function with error and ARP table
   */
  export function getTable(
    callback: (err: Error | null, table: Record<string, string>) => void,
  ): void;
}
