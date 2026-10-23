import type { Session } from './types';

const KEY = 'hms';

export const session = {
  get: (): Session | null => JSON.parse(localStorage.getItem(KEY) || 'null'),
  set: (s: Session) => localStorage.setItem(KEY, JSON.stringify(s)),
  clear: () => localStorage.removeItem(KEY),
};

interface Options {
  method?: string;
  body?: unknown;
}

async function request(path: string, { method = 'GET', body }: Options = {}) {
  const s = session.get();
  const headers: Record<string, string> = {};
  if (s) headers.Authorization = 'Bearer ' + s.token;
  if (body && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';

  const res = await fetch('/api' + path, {
    method,
    headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401 && s) {
    session.clear();
    location.href = '/';
  }
  return res;
}

/** Call the API and return parsed JSON; throws Error(message) on failure. */
export async function api<T = any>(path: string, options?: Options): Promise<T> {
  const res = await request(path, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed.');
  return data as T;
}

/** Download a file or PDF from the API and open it in a new tab. */
export async function openFile(path: string) {
  const res = await request(path);
  if (!res.ok) throw new Error('Could not open the file.');
  window.open(URL.createObjectURL(await res.blob()));
}
