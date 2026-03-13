import type { BlockMission } from '../types';

function toFiniteNumber(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getSafeMissionTargetValue(mission: Pick<BlockMission, 'target'>): number {
  return Math.max(1, toFiniteNumber(mission.target.value) ?? 1);
}

export function getSafeMissionCurrentValue(mission: Pick<BlockMission, 'progress'>): number {
  return Math.max(0, toFiniteNumber(mission.progress.current) ?? 0);
}

export function getMissionProgressPercent(mission: Pick<BlockMission, 'target' | 'progress'>): number {
  const target = getSafeMissionTargetValue(mission);
  const current = getSafeMissionCurrentValue(mission);
  return Math.min(100, Math.round((current / target) * 100));
}

export function getMissionProgressLabel(mission: Pick<BlockMission, 'target' | 'progress'>): string {
  const target = Math.round(getSafeMissionTargetValue(mission));
  const current = Math.round(getSafeMissionCurrentValue(mission));
  const unit = mission.target.unit ? ` ${mission.target.unit}` : '';
  return `${current}/${target}${unit}`;
}
