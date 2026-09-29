// Demo-only client-side gate. Not a security boundary for paid/private content.
export const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
const sessionKey = 'unischool-demo-session-v1';
const salt = '4783bf7559ffe2db53ac1fcaa1933892';
const verifier =
  'e1e35cf6a793ff5392f2f856ffc3282ad0672e95fc266cac56aa5e100e79d458';
export function isSignedIn() {
  try {
    const session = JSON.parse(localStorage.getItem(sessionKey) || 'null');
    return (
      ['alexandra-demo', 'teacher-demo'].includes(session?.profile) &&
      session.expires > Date.now()
    );
  } catch {
    return false;
  }
}
export function role() {
  try {
    return JSON.parse(localStorage.getItem(sessionKey))?.profile ===
      'teacher-demo'
      ? 'teacher'
      : 'student';
  } catch {
    return 'student';
  }
}
export function currentProfileId() {
  if (!isSignedIn()) return null;
  return JSON.parse(localStorage.getItem(sessionKey)).profile;
}
export function homeRoute() {
  return `${base}${role() === 'teacher' ? 'teacher' : 'learn'}/`;
}
export async function signIn(login, password) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: new TextEncoder().encode(salt),
      iterations: 120000,
      hash: 'SHA-256',
    },
    key,
    256,
  );
  const hash = Array.from(new Uint8Array(bits), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join('');
  const username = login.trim().toLowerCase();
  if (!['demo', 'teacher'].includes(username) || hash !== verifier)
    return false;
  localStorage.setItem(
    sessionKey,
    JSON.stringify({
      profile: username === 'teacher' ? 'teacher-demo' : 'alexandra-demo',
      expires: Date.now() + 7 * 86400000,
    }),
  );
  return true;
}
export function requireSession(requiredRole) {
  if (!isSignedIn() || (requiredRole && role() !== requiredRole)) {
    location.replace(
      `${base}?login=1${requiredRole === 'teacher' ? '&role=teacher' : ''}`,
    );
    throw new Error('Demo sign-in required');
  }
  document.documentElement.removeAttribute('data-auth-pending');
}
export function signOut() {
  localStorage.removeItem(sessionKey);
  location.replace(base);
}
