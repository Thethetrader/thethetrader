// Gestion des notifications Web Push pour le chat support (sans Firebase Server Key)

const VAPID_PUBLIC_KEY = 'BMvSccJxRJmTOeJ1p6EO4ibbbhBkPy1DzxcJf4VIAhBTS1kAEqoETROeukoxF9Ga25VRHh-Ahgcr1HNKKxn9T3E';
const SAVE_URL = '/.netlify/functions/save-push-token';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

export async function subscribeSupportPush(userKey: string, role: 'user' | 'admin' = 'user'): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;

    const permission = Notification.permission === 'granted'
      ? 'granted'
      : await Notification.requestPermission();
    if (permission !== 'granted') return false;

    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();

    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    await fetch(SAVE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_key: userKey, subscription: sub.toJSON(), role }),
    });

    return true;
  } catch (e) {
    return false;
  }
}
