import type { WeightUnit } from '../types';

const KG_TO_LBS = 2.2046226218;

function roundTo(value: number, decimals: number): number {
	const factor = 10 ** decimals;
	return Math.round(value * factor) / factor;
}

export function toDisplayWeight(kgValue: number, unit: WeightUnit): number {
	if (unit === 'kg') return kgValue;
	return kgValue * KG_TO_LBS;
}

export function toStoredWeight(value: number, unit: WeightUnit): number {
	if (unit === 'kg') return value;
	return value / KG_TO_LBS;
}

export function formatWeightValue(kgValue: number, unit: WeightUnit): string {
	const converted = toDisplayWeight(kgValue, unit);
	return String(roundTo(converted, 1));
}

export function formatMass(kgValue: number, unit: WeightUnit): string {
	const converted = toDisplayWeight(kgValue, unit);
	const rounded = Math.round(converted);
	return `${rounded.toLocaleString()} ${unit}`;
}
