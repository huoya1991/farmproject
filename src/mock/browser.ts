import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'
import { storage } from './storage'
import { SEED_PLANS } from './seed'

export async function startMockWorker(): Promise<void> {
  if (storage.read().length === 0) storage.write(SEED_PLANS)
  const worker = setupWorker(...handlers)
  await worker.start({ onUnhandledRequest: 'bypass', quiet: true })
}
