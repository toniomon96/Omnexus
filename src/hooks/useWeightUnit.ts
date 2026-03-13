import { useEffect, useState } from 'react';
import type { WeightUnit } from '../types';
import { getWeightUnit, WEIGHT_UNIT_CHANGED_EVENT } from '../utils/localStorage';

export function useWeightUnit(): WeightUnit {
  const [unit, setUnit] = useState<WeightUnit>(() => getWeightUnit());

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key === 'omnexus_weight_unit') {
        setUnit(getWeightUnit());
      }
    }

    function onWeightUnitChanged() {
      setUnit(getWeightUnit());
    }

    window.addEventListener('storage', onStorage);
    window.addEventListener(WEIGHT_UNIT_CHANGED_EVENT, onWeightUnitChanged);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(WEIGHT_UNIT_CHANGED_EVENT, onWeightUnitChanged);
    };
  }, []);

  return unit;
}
