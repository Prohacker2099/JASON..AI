import { EventEmitter } from 'events';

export type ValueName = 'morality' | 'kindness' | 'courage' | 'determination' | 'empathy' | 'helpfulness';

export interface ValueWeights {
  morality: number;
  kindness: number;
  courage: number;
  determination: number;
  empathy: number;
  helpfulness: number;
}

export const defaultWeights: ValueWeights = {
  morality: 1.0,
  kindness: 1.0,
  courage: 1.0,
  determination: 1.0,
  empathy: 1.0,
  helpfulness: 1.0,
};

export function normalizeWeights(w: ValueWeights): ValueWeights {
  const vals = Object.values(w);
  const sum = vals.reduce((a, b) => a + (isFinite(b) ? b : 0), 0) || 1;
  const clamp = (x: number) => Math.max(0, Math.min(10, Number.isFinite(x) ? x : 0));
  return {
    morality: clamp(w.morality) / sum,
    kindness: clamp(w.kindness) / sum,
    courage: clamp(w.courage) / sum,
    determination: clamp(w.determination) / sum,
    empathy: clamp(w.empathy) / sum,
    helpfulness: clamp(w.helpfulness) / sum,
  } as ValueWeights;
}

const tagToValue: Record<string, ValueName> = {
  moral: 'morality',
  safe: 'morality',
  ethical: 'morality',
  kind: 'kindness',
  nice: 'kindness',
  polite: 'kindness',
  brave: 'courage',
  risk: 'courage',
  persist: 'determination',
  focus: 'determination',
  empath: 'empathy',
  care: 'empathy',
  help: 'helpfulness',
  assist: 'helpfulness',
  support: 'helpfulness',
};

export interface RewardSignal {
  tags?: string[];
  success?: boolean;
  feedback?: number; // external feedback [-1,1]
  riskLevel?: number; // [0..1]
}

export function computeReward(weights: ValueWeights, signal: RewardSignal): number {
  const w = normalizeWeights(weights);
  let r = 0;
  const tags = (signal.tags || []).map(t => String(t).toLowerCase());
  for (const t of tags) {
    for (const key of Object.keys(tagToValue)) {
      if (t.includes(key)) {
        const v = tagToValue[key];
        r += (w as any)[v] || 0;
      }
    }
  }
  if (signal.success === true) r += 0.5;
  if (signal.success === false) r -= 0.5;
  if (typeof signal.feedback === 'number') r += Math.max(-1, Math.min(1, signal.feedback)) * 0.5;
  if (typeof signal.riskLevel === 'number') {
    // Penalize high risk weighted by morality
    const risk = Math.max(0, Math.min(1, signal.riskLevel));
    r -= risk * (w.morality * 0.8);
  }
  return r;
}

export function isActionAllowed(weights: ValueWeights, signal: RewardSignal): boolean {
  // Simple safety gate: high risk actions require high courage but are gated by morality
  const risk = Math.max(0, Math.min(1, signal.riskLevel ?? 0));
  const w = normalizeWeights(weights);
  if (risk > 0.8 && w.morality < 0.2) return false;
  return true;
}

export class ValuePolicy extends EventEmitter {
  private weights: ValueWeights = normalizeWeights(defaultWeights);

  getWeights(): ValueWeights {
    return this.weights;
  }

  setWeights(next: Partial<ValueWeights>): ValueWeights {
    this.weights = normalizeWeights({ ...this.weights, ...(next as ValueWeights) });
    this.emit('weights', this.weights);
    return this.weights;
  }

  reward(signal: RewardSignal): number {
    return computeReward(this.weights, signal);
  }

  allowed(signal: RewardSignal): boolean {
    return isActionAllowed(this.weights, signal);
  }
}
