// =============================================
// BROWSER PUSH NOTIFICATIONS
// Uses the native Web Notifications API (no external service required).
// =============================================

export function notificationsSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return 'denied';
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission;
  }
  return await Notification.requestPermission();
}

export function showBrowserNotification(title: string, body: string, link?: string) {
  if (!notificationsSupported() || Notification.permission !== 'granted') return;
  try {
    const n = new Notification(title, { body, icon: '/favicon.ico', tag: 'bloodlink' });
    if (link) {
      n.onclick = () => {
        window.focus();
        window.location.href = link;
        n.close();
      };
    }
  } catch {
    // ignore — some browsers throw on background pages
  }
}
