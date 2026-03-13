import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  WEIGHT_UNIT_CHANGED_EVENT,
  getWeightUnit,
  setWeightUnit,
} from '../utils/localStorage';
import { subscribeToWeightUnitChanges } from './useWeightUnit';

type EventHandler = (event: Event) => void;

const listeners = new Map<string, EventHandler[]>();
const storage: Record<string, string> = {};

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
  dispatchEvent: vi.fn((event: Event) => {
    const handlers = getListeners(event.type);
    for (const handler of handlers) {
      handler(event);
    }
    return true;
  }),
});

vi.stubGlobal('localStorage', {
  getItem: vi.fn((key: string) => storage[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    storage[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete storage[key];
  }),
  clear: vi.fn(() => {
    for (const key of Object.keys(storage)) {
      delete storage[key];
    }
  }),
});

describe('subscribeToWeightUnitChanges', () => {
  beforeEach(() => {
    listeners.clear();
    for (const key of Object.keys(storage)) {
      delete storage[key];
    }
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

  it('integrates with setWeightUnit/getWeightUnit via same-tab event dispatch', () => {
    const onUnitChange = vi.fn();
    subscribeToWeightUnitChanges(onUnitChange);

    expect(getWeightUnit()).toBe('lbs');

    setWeightUnit('kg');

    expect(getWeightUnit()).toBe('kg');
    expect(onUnitChange).toHaveBeenCalledTimes(1);
  });
});
