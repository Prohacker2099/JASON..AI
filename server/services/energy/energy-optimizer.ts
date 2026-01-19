import { EventEmitter } from 'events';
import { z } from 'zod';

// Shared UC interface expectation
export interface UnifiedDeviceControlLike {
  listDevices: () => Array<{ id: string; type: string; room?: string; zone?: string; state?: any }>;
  getDeviceState: (id: string) => any;
  sendCommand: (id: string, command: string, payload?: any) => Promise<void> | void;
}

type ZonePolicy = {
  maxBrightness?: number;
  turnOffIdlePlugs?: boolean;
  hvacSetpoint?: number;
};

export const EnergyPolicySchema = z.object({
  enabled: z.boolean().default(true),
  // Quiet hours reduce brightness, power off idle plugs, relax HVAC setpoint a bit
  quietHours: z.object({ from: z.string(), to: z.string() }).optional(), // '22:00' - '06:30'
  // Per-zone targets
  zones: z
    .record(
      z.string(),
      z.object({
        maxBrightness: z.number().min(0).max(100).optional(),
        turnOffIdlePlugs: z.boolean().optional(),
        hvacSetpoint: z.number().min(10).max(30).optional(),
      })
    )
    .default({}),
  // Idle cutoff in minutes to power down certain device types
  idleMinutesCutoff: z.number().min(1).max(240).default(30),
});

export type EnergyPolicy = z.infer<typeof EnergyPolicySchema>;

export class EnergyOptimizer extends EventEmitter {
  private policy: EnergyPolicy;
  private timer: NodeJS.Timeout | null = null;
  private uc: UnifiedDeviceControlLike | null = null;

  constructor(initial?: Partial<EnergyPolicy>) {
    super();
    this.policy = EnergyPolicySchema.parse({ ...initial });
  }

  attachUnifiedControl(uc: UnifiedDeviceControlLike) {
    this.uc = uc;
  }

  getPolicy(): EnergyPolicy {
    return this.policy;
  }

  setPolicy(next: Partial<EnergyPolicy>) {
    this.policy = EnergyPolicySchema.parse({ ...this.policy, ...next });
    this.emit('policy', this.policy);
  }

  start(intervalMs = 5 * 60 * 1000) {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => this.optimize().catch(() => {}), intervalMs);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private inQuietHours(now: Date) {
    const qh = this.policy.quietHours;
    if (!qh) return false;
    const toMins = (hhmm: string) => {
      const [h, m] = hhmm.split(':').map((x) => Number(x));
      return h * 60 + (m || 0);
    };
    const cur = now.getHours() * 60 + now.getMinutes();
    const from = toMins(qh.from);
    const to = toMins(qh.to);
    // Handles ranges crossing midnight
    if (from <= to) return cur >= from && cur <= to;
    return cur >= from || cur <= to;
  }

  async optimize(): Promise<{ actions: number }> {
    if (!this.policy.enabled) return { actions: 0 };
    if (!this.uc) throw new Error('UnifiedDeviceControl unavailable');

    const devices = this.uc.listDevices();
    const now = new Date();
    const quiet = this.inQuietHours(now);
    let actions = 0;

    for (const d of devices) {
      const state = this.uc.getDeviceState(d.id) || {};
      const zone = d.zone || d.room || 'default';
      const zPolicy: ZonePolicy = this.policy.zones[zone] ?? {};

      // Smart lights: reduce brightness during quiet hours or to zone cap
      if (d.type.includes('light')) {
        const current = Number(state.brightness ?? 100);
        let target = current;
        if (quiet) target = Math.min(target, 20);
        if (zPolicy.maxBrightness != null) target = Math.min(target, zPolicy.maxBrightness);
        if (target !== current) {
          await Promise.resolve(this.uc.sendCommand(d.id, 'setBrightness', { brightness: target }));
          actions++;
          this.emit('action', { deviceId: d.id, type: d.type, action: 'setBrightness', value: target });
        }
      }

      // Smart plugs: turn off if idle beyond cutoff and zone allows
      if (d.type.includes('plug')) {
        const cutoffMin = this.policy.idleMinutesCutoff;
        const lastActiveIso = state.lastActive || state.lastSeen || state.updatedAt;
        const zoneAllowOff = zPolicy.turnOffIdlePlugs ?? true;
        if (zoneAllowOff && lastActiveIso) {
          const last = new Date(lastActiveIso).getTime();
          if (!Number.isNaN(last)) {
            const idleMin = (now.getTime() - last) / 60000;
            const power = Number(state.power ?? 0);
            if (idleMin >= cutoffMin && power > 0) {
              await Promise.resolve(this.uc.sendCommand(d.id, 'toggle', {}));
              actions++;
              this.emit('action', { deviceId: d.id, type: d.type, action: 'toggle', value: 0 });
            }
          }
        }
      }

      // Thermostats: relax setpoint a bit (e.g., +1C) during quiet hours or to zone target
      if (d.type.includes('thermostat')) {
        const current = Number(state.setpoint ?? 21);
        let target = current;
        if (quiet) target = current + 1;
        if (zPolicy.hvacSetpoint != null) target = zPolicy.hvacSetpoint;
        if (target !== current) {
          await Promise.resolve(this.uc.sendCommand(d.id, 'setSetpoint', { setpoint: target }));
          actions++;
          this.emit('action', { deviceId: d.id, type: d.type, action: 'setSetpoint', value: target });
        }
      }
    }

    if (actions > 0) this.emit('optimize', { actions, timestamp: now.toISOString() });
    return { actions };
  }
}

export const energyOptimizer = new EnergyOptimizer({
  enabled: true,
  quietHours: { from: '22:00', to: '06:30' },
  zones: {},
  idleMinutesCutoff: 45,
});
