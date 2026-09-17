import type { InspectRecord } from '@/types/inspection'

const KEY = 'lx_inspect_records_v1'

export const inspectStorage = {
  read(): InspectRecord[] {
    try {
      const raw = localStorage.getItem(KEY)
      return raw ? (JSON.parse(raw) as InspectRecord[]) : []
    } catch { return [] }
  },
  write(records: InspectRecord[]): void {
    localStorage.setItem(KEY, JSON.stringify(records))
  }
}
