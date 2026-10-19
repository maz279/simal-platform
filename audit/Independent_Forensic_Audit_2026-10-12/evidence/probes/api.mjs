// minimal cookie-jar API client for the portal (127.0.0.1:8090)
export const BASE = 'http://127.0.0.1:8090';
export function client() {
  const jar = new Map();
  const cookieHeader = () => [...jar].map(([k, v]) => `${k}=${v}`).join('; ');
  async function call(method, path, body, extraHeaders = {}) {
    const headers = { ...extraHeaders };
    if (jar.size) headers.cookie = cookieHeader();
    if (body !== undefined) headers['content-type'] = 'application/json';
    const t0 = Date.now();
    const res = await fetch(BASE + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), redirect: 'manual' });
    for (const sc of res.headers.getSetCookie?.() || []) {
      const [kv] = sc.split(';'); const i = kv.indexOf('=');
      jar.set(kv.slice(0, i).trim(), kv.slice(i + 1).trim());
    }
    const text = await res.text();
    let data; try { data = JSON.parse(text); } catch { data = text; }
    return { status: res.status, ms: Date.now() - t0, data, headers: Object.fromEntries(res.headers), setCookie: res.headers.getSetCookie?.() || [] };
  }
  return { call, jar };
}
