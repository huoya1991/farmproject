export class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string, public requestId?: string) { super(message) }
}
export class NetworkError extends Error {
  constructor(message = '网络异常，请稍后重试') { super(message) }
}

type Listener = () => void
type Events = 'auth-expired'

class ApiClient {
  private token: string | null = null
  private listeners = new Map<Events, Set<Listener>>()

  setToken(t: string | null) { this.token = t }
  on(evt: Events, fn: Listener) {
    const set = this.listeners.get(evt) ?? new Set()
    set.add(fn); this.listeners.set(evt, set)
    return () => set.delete(fn)
  }
  private emit(evt: Events) { this.listeners.get(evt)?.forEach(fn => fn()) }

  async request<T>(input: { method: 'GET'|'POST'|'PUT'|'DELETE'; url: string; body?: unknown; params?: Record<string, string|number|undefined> }): Promise<T> {
    const qs = input.params
      ? '?' + Object.entries(input.params).filter(([,v]) => v!==undefined && v!=='').map(([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&')
      : ''
    const headers: Record<string, string> = { 'Accept': 'application/json' }
    if (this.token) headers.Authorization = `Bearer ${this.token}`
    if (input.body !== undefined) headers['Content-Type'] = 'application/json'
    let res: Response
    try {
      res = await fetch(input.url + qs, { method: input.method, headers, body: input.body === undefined ? null : JSON.stringify(input.body) })
    } catch {
      throw new NetworkError()
    }
    if (res.status === 401) { this.emit('auth-expired'); throw new ApiError(401, '登录已过期') }
    const ct = res.headers.get('content-type') ?? ''
    const payload = ct.includes('application/json') ? await res.json().catch(() => ({})) : await res.text()
    if (!res.ok) {
      const p = typeof payload === 'object' && payload ? payload as Record<string, unknown> : {}
      throw new ApiError(res.status, (p.message as string) ?? `HTTP ${res.status}`, p.code as string | undefined)
    }
    return payload as T
  }
}

export const apiClient = new ApiClient()
