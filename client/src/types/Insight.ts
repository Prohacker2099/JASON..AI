export interface Insight {
  id: string;
  type: 'energy' | 'wellness' | 'productivity' | 'security';
  message: string;
  actionable: boolean;
  priority: number;
}
