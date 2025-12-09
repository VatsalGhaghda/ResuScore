export function getClientId(): string {
  const STORAGE_KEY = 'resuscoreClientId';

  if (typeof window === 'undefined') {
    // SSR safety: just return a dummy value
    return 'server-client';
  }

  let id = window.localStorage.getItem(STORAGE_KEY);
  if (!id) {
    if (window.crypto && 'randomUUID' in window.crypto) {
      id = window.crypto.randomUUID();
    } else {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    }
    window.localStorage.setItem(STORAGE_KEY, id);
  }

  return id;
}
