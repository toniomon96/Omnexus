import { useEffect, useState } from 'react';
import type { WeightUnit } from '../types';
import { getWeightUnit } from '../utils/localStorage';

export function useWeightUnit(): WeightUnit {
  const [unit, setUnit] = useState<WeightUnit>(() => getWeightUnit());

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key === 'omnexus_weight_unit') {
        setUnit(getWeightUnit());
      }
    }

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return unit;
}
