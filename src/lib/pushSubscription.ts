import { isNative } from './capacitor';

let supabasePromise: Promise<(typeof import('./supabase'))['supabase']> | null = null;

async function getSupabase() {
  supabasePromise ??= import('./supabase').then((module) => module.supabase);
  return supabasePromise;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export type PushPermission = 'granted' | 'denied' | 'default' | 'unsupported';

export async function getPushPermission(): Promise<PushPermission> {
  // Web Push (VAPID + service worker) is not supported inside Capacitor WebViews.
  // Push notifications for native are handled separately in a future phase.
  if (isNative) return 'unsupported';
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    return 'unsupported';
  }
  return Notification.permission as PushPermission;
}

export async function isSubscribed(): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator)) return false;
    const reg = await navigator.serviceWorker.getRegistration('/sw.js');
    if (!reg) return false;
    const sub = await reg.pushManager.getSubscription();
    return !!sub;
  } catch {
    return false;
  }
}

async function getOrRegisterSW(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    // Reuse an existing registration if available
    const existing = await navigator.serviceWorker.getRegistration('/sw.js');
    if (existing) return existing;
    return await navigator.serviceWorker.register('/sw.js');
  } catch (err) {
    console.error('[Push] SW registration failed:', err);
    return null;
  }
}

export async function subscribeToPush(userId: string): Promise<boolean> {
  try {
    const supabase = await getSupabase();
    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
    if (!vapidKey) {
      console.error('[Push] VITE_VAPID_PUBLIC_KEY not configured');
      return false;
    }

    const reg = await getOrRegisterSW();
    if (!reg) return false;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;

    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });

    const json = subscription.toJSON();
    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: userId,
        endpoint: json.endpoint,
        p256dh: json.keys?.p256dh,
        auth: json.keys?.auth,
      },
      { onConflict: 'user_id,endpoint' },
    );

    if (error) {
      console.error('[Push] Failed to save subscription:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[Push] Subscribe failed:', err);
    return false;
  }
}

export async function unsubscribeFromPush(userId: string): Promise<void> {
  try {
    const supabase = await getSupabase();
    if (!('serviceWorker' in navigator)) return;
    const reg = await navigator.serviceWorker.getRegistration('/sw.js');
    if (!reg) return;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;
    const endpoint = sub.endpoint;
    await sub.unsubscribe();
    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId)
      .eq('endpoint', endpoint);
  } catch (err) {
    console.error('[Push] Unsubscribe failed:', err);
  }
}
