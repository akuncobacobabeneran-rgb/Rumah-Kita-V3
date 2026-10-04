// Native System Notifications & Sound feedback utility for RumahKita

export type NativePermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

export function isNativeNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNativeNotificationPermission(): NativePermissionStatus {
  if (!isNativeNotificationSupported()) return 'unsupported';
  return Notification.permission as NativePermissionStatus;
}

export async function requestNativeNotificationPermission(): Promise<NativePermissionStatus> {
  if (!isNativeNotificationSupported()) return 'unsupported';
  try {
    const permission = await Notification.requestPermission();
    return permission as NativePermissionStatus;
  } catch (err) {
    console.warn('Failed to request notification permission:', err);
    return getNativeNotificationPermission();
  }
}

// Gentle pleasant synthetic chime via Web Audio API (no external asset needed)
export function playNotificationChime(): void {
  try {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const now = ctx.currentTime;
    // Play warm two-tone chime (523Hz C5 -> 659Hz E5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.15, now + 0.04);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.36);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659.25, now + 0.12);
    gain2.gain.setValueAtTime(0, now + 0.12);
    gain2.gain.linearRampToValueAtTime(0.18, now + 0.16);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.61);
  } catch {
    // Non-critical audio feedback fallback
  }
}

interface SendNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  playSound?: boolean;
}

export async function sendNativeNotification(options: SendNotificationOptions): Promise<boolean> {
  if (!isNativeNotificationSupported()) return false;
  if (Notification.permission !== 'granted') return false;

  const defaultIcon = '/icon.svg';
  const notificationOptions: NotificationOptions = {
    body: options.body,
    icon: options.icon || defaultIcon,
    badge: options.badge || defaultIcon,
    tag: options.tag || 'rumahkita-alert',
    data: options.data,
    requireInteraction: false,
  };

  if (options.playSound !== false) {
    playNotificationChime();
  }

  try {
    // Prefer service worker showNotification for mobile PWA push display
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration && typeof registration.showNotification === 'function') {
          await registration.showNotification(options.title, notificationOptions);
          return true;
        }
      } catch {
        // Fall back to standard Notification constructor
      }
    }

    new Notification(options.title, notificationOptions);
    return true;
  } catch (err) {
    console.warn('Native notification display failed:', err);
    return false;
  }
}

export async function sendTestNotification(): Promise<boolean> {
  const perm = await requestNativeNotificationPermission();
  if (perm !== 'granted') return false;

  return sendNativeNotification({
    title: '🔔 Notifikasi RumahKita Aktif',
    body: 'Notifikasi ponsel berhasil dihubungkan! Pengingat agenda, task terlewat, dan limit anggaran akan tampil di sini.',
    tag: 'rumahkita-test',
    playSound: true,
  });
}
