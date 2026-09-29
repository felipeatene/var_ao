import type { SubscriptionTier } from '../types';
export type UpgradeReason = 'camera_limit' | 'weekly_highlight_limit' | 'export_1080p' | 'remove_watermark';
export const FREE_LIMITS = { cameras: 2, weeklyHighlights: 3 } as const;
export function requiresPro(tier: SubscriptionTier, reason: UpgradeReason, count = 0): boolean {
  if (tier === 'pro') return false;
  return reason === 'camera_limit' ? count >= FREE_LIMITS.cameras : reason === 'weekly_highlight_limit' ? count >= FREE_LIMITS.weeklyHighlights : true;
}
export function weekKey(date = new Date()): string {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
  return `${monday.getFullYear()}-${String(monday.getMonth()+1).padStart(2,'0')}-${String(monday.getDate()).padStart(2,'0')}`;
}
export function parseUsage(raw: string | null, date = new Date()): number {
  try { const value = JSON.parse(raw ?? 'null'); return value?.week === weekKey(date) && Number.isSafeInteger(value.count) && value.count >= 0 ? value.count : 0; } catch { return 0; }
}
export function createWeeklyUsage(getStorage: () => Pick<Storage, 'getItem' | 'setItem'>) {
  const key = 'outro-angulo.weekly-highlights.v1';
  let memory = {week: '', count: 0};
  let persistent = true;
  return {
    read(date = new Date()) {
      if (memory.week !== weekKey(date)) memory = {week: weekKey(date), count: 0};
      if (persistent) try { memory.count = parseUsage(getStorage().getItem(key), date); } catch { persistent = false; }
      return {count: memory.count, persistent};
    },
    increment(date = new Date()) {
      this.read(date); memory.count++;
      if (persistent) try { getStorage().setItem(key, JSON.stringify(memory)); } catch { persistent = false; }
      return {count: memory.count, persistent};
    },
  };
}
