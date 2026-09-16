import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient, ApiError, NetworkError } from '@/api/client'

describe('apiClient', () => {
  beforeEach(() => { apiClient.setToken('t123') })

  it('sends Authorization header and returns JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok:1 }), { status:200, headers:{ 'content-type':'application/json' } }))
    vi.stubGlobal('fetch', fetchMock)
    const data = await apiClient.request<{ ok:number }>({ method:'GET', url:'/api/ping' })
    expect(data.ok).toBe(1)
    const call = fetchMock.mock.calls[0]!
    expect(call[1].headers.Authorization).toBe('Bearer t123')
  })

  it('throws ApiError with status on non-2xx', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ message:'bad' }), { status:400, headers:{ 'content-type':'application/json' } })))
    await expect(apiClient.request({ method:'GET', url:'/api/x' })).rejects.toBeInstanceOf(ApiError)
  })

  it('emits auth-expired on 401', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status:401 })))
    const handler = vi.fn()
    apiClient.on('auth-expired', handler)
    await expect(apiClient.request({ method:'GET', url:'/api/x' })).rejects.toBeInstanceOf(ApiError)
    expect(handler).toHaveBeenCalled()
  })

  it('wraps network failure as NetworkError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')))
    await expect(apiClient.request({ method:'GET', url:'/api/x' })).rejects.toBeInstanceOf(NetworkError)
  })
})
