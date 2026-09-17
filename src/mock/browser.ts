import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'
import { storage } from './storage'
import { SEED_PLANS } from './seed'
import { inspectStorage } from './inspectStorage'
import { SEED_INSPECT_RECORDS } from './inspectSeed'

export async function startMockWorker(): Promise<void> {
  if (storage.read().length === 0) storage.write(SEED_PLANS)
  if (inspectStorage.read().length === 0) inspectStorage.write(SEED_INSPECT_RECORDS)
  const worker = setupWorker(...handlers)
  await worker.start({ onUnhandledRequest: 'bypass', quiet: true })
}
