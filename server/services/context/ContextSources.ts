export type CalendarBusy = { busy: boolean; source: string; ts: number }
export type DeviceEnergy = { battery: number | null; mode: 'normal' | 'low' | 'charging'; ts: number }
export type NetworkState = { kind: 'wifi' | 'ethernet' | 'cellular' | 'unknown'; online: boolean; ts: number }
export async function getCalendarBusy(): Promise<CalendarBusy> { return { busy: false, source: 'local', ts: Date.now() } }
export async function getDeviceEnergy(): Promise<DeviceEnergy> { return { battery: null, mode: 'normal', ts: Date.now() } }
export async function getNetworkState(): Promise<NetworkState> { return { kind: 'unknown', online: true, ts: Date.now() } }
export async function getContextSnapshot() {
  const [busy, energy, net] = await Promise.all([getCalendarBusy(), getDeviceEnergy(), getNetworkState()])
  return { busy, energy, net }
}
export default { getCalendarBusy, getDeviceEnergy, getNetworkState, getContextSnapshot }
