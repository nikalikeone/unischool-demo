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
      session?.profile === 'alexandra-demo' && session.expires > Date.now()
    );
  } catch {
    return false;
  }
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
  if (login.trim().toLowerCase() !== 'demo' || hash !== verifier) return false;
  localStorage.setItem(
    sessionKey,
    JSON.stringify({
      profile: 'alexandra-demo',
      expires: Date.now() + 7 * 86400000,
    }),
  );
  return true;
}
export function requireSession() {
  if (!isSignedIn()) {
    location.replace(`${base}?login=1`);
    throw new Error('Demo sign-in required');
  }
  document.documentElement.removeAttribute('data-auth-pending');
}
export function signOut() {
  localStorage.removeItem(sessionKey);
  location.replace(base);
}
