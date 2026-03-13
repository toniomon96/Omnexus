import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WEIGHT_UNIT_CHANGED_EVENT } from '../utils/localStorage';
import { subscribeToWeightUnitChanges } from './useWeightUnit';

type EventHandler = (event: Event) => void;

const listeners = new Map<string, EventHandler[]>();

function getListeners(eventName: string): EventHandler[] {
  return listeners.get(eventName) ?? [];
}

vi.stubGlobal('window', {
  addEventListener: vi.fn((eventName: string, handler: EventHandler) => {
    const existing = getListeners(eventName);
    listeners.set(eventName, [...existing, handler]);
  }),
  removeEventListener: vi.fn((eventName: string, handler: EventHandler) => {
    const existing = getListeners(eventName).filter((entry) => entry !== handler);
    listeners.set(eventName, existing);
  }),
});

describe('subscribeToWeightUnitChanges', () => {
  beforeEach(() => {
    listeners.clear();
    vi.clearAllMocks();
  });

  it('notifies for storage changes on omnexus_weight_unit key', () => {
    const onUnitChange = vi.fn();
    subscribeToWeightUnitChanges(onUnitChange);

    const storageListeners = getListeners('storage');
    expect(storageListeners).toHaveLength(1);

    storageListeners[0]({ key: 'omnexus_weight_unit' } as StorageEvent);
    storageListeners[0]({ key: 'other_key' } as StorageEvent);

    expect(onUnitChange).toHaveBeenCalledTimes(1);
  });

  it('notifies for same-tab custom weight-unit change event', () => {
    const onUnitChange = vi.fn();
    subscribeToWeightUnitChanges(onUnitChange);

    const customListeners = getListeners(WEIGHT_UNIT_CHANGED_EVENT);
    expect(customListeners).toHaveLength(1);

    customListeners[0](new Event(WEIGHT_UNIT_CHANGED_EVENT));

    expect(onUnitChange).toHaveBeenCalledTimes(1);
  });

  it('unsubscribes both listeners on cleanup', () => {
    const onUnitChange = vi.fn();
    const unsubscribe = subscribeToWeightUnitChanges(onUnitChange);

    expect(getListeners('storage')).toHaveLength(1);
    expect(getListeners(WEIGHT_UNIT_CHANGED_EVENT)).toHaveLength(1);

    unsubscribe();

    expect(getListeners('storage')).toHaveLength(0);
    expect(getListeners(WEIGHT_UNIT_CHANGED_EVENT)).toHaveLength(0);
  });
});
