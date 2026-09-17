import type { InspectRecord } from '@/types/inspection'

const ts = (s: string) => Date.parse(s + 'T08:00:00')

export const SEED_INSPECT_RECORDS: InspectRecord[] = [
  { id: 's1', date: '2026-09-17', deviceCode: 'TR001', deviceName: '拖拉机',
    meterResult: '正常', vehicleResult: '正常', vehicleStatus: '正常',
    durationValue: 128.5, durationUnit: '小时', inspector: '王强', operator: '张三',
    createdAt: ts('2026-09-17') },
  { id: 's2', date: '2026-09-16', deviceCode: 'XGJ003', deviceName: '旋耕机',
    meterResult: '异常', vehicleResult: '异常', vehicleStatus: '异常',
    durationValue: 86, durationUnit: '小时', inspector: '李四', operator: '王五',
    note: '油压表读数异常，待检修', createdAt: ts('2026-09-16') },
  { id: 's3', date: '2026-09-15', deviceCode: 'LHS002', deviceName: '联合收割机',
    meterResult: '正常', vehicleResult: '正常', vehicleStatus: '正常',
    durationValue: 215, durationUnit: '公里', inspector: '王强', operator: '李四',
    createdAt: ts('2026-09-15') },
  { id: 's4', date: '2026-09-12', deviceCode: 'SB004', deviceName: '水泵',
    meterResult: '正常', vehicleResult: '正常', vehicleStatus: '正常',
    durationValue: 40, durationUnit: '小时', inspector: '赵六', operator: '赵六',
    createdAt: ts('2026-09-12') },
  { id: 's5', date: '2026-09-08', deviceCode: 'UAV006', deviceName: '植保无人机',
    meterResult: '异常', vehicleResult: '正常', vehicleStatus: '异常',
    durationValue: 12, durationUnit: '小时', inspector: '王强', operator: '王强',
    note: '电量显示跳变', createdAt: ts('2026-09-08') },
  { id: 's6', date: '2026-09-03', deviceCode: 'SFJ005', deviceName: '撒肥机',
    meterResult: '正常', vehicleResult: '正常', vehicleStatus: '正常',
    durationValue: 60, durationUnit: '公里', inspector: '陈七', operator: '陈七',
    createdAt: ts('2026-09-03') }
]
