import type { CheckResult, InspectPayload } from '@/types/inspection'

export interface InspectValidationError { field: string; message: string }
export interface InspectValidationResult { ok: boolean; errors: InspectValidationError[] }

type StatusSource = Pick<InspectPayload, 'meterResult' | 'vehicleResult' | 'vehicleStatus'>

export function deriveInspectStatus(r: StatusSource): CheckResult {
  return (r.meterResult === '异常' || r.vehicleResult === '异常' || r.vehicleStatus === '异常') ? '异常' : '正常'
}

// 一位小数用字符串正则判断，规避 12.55*10 的浮点误差
const ONE_DECIMAL_RE = /^\d+(\.\d)?$/

export function validateInspect(p: InspectPayload): InspectValidationResult {
  const errors: InspectValidationError[] = []
  if (!p.date) errors.push({ field: 'date', message: '请选择点检日期' })
  if (!p.deviceCode.trim()) errors.push({ field: 'deviceCode', message: '请选择设备编号' })
  if (!p.deviceName.trim()) errors.push({ field: 'deviceName', message: '设备名称不能为空' })
  if (!p.meterResult) errors.push({ field: 'meterResult', message: '请选择仪表检查结果' })
  if (!p.vehicleResult) errors.push({ field: 'vehicleResult', message: '请选择车况检查结果' })
  if (!p.vehicleStatus) errors.push({ field: 'vehicleStatus', message: '请选择车辆状态' })
  if (!Number.isFinite(p.durationValue) || p.durationValue <= 0) {
    errors.push({ field: 'durationValue', message: '使用时长必须大于 0' })
  } else if (!ONE_DECIMAL_RE.test(String(p.durationValue))) {
    errors.push({ field: 'durationValue', message: '使用时长最多一位小数' })
  }
  if (!p.durationUnit.trim()) errors.push({ field: 'durationUnit', message: '请选择使用时长单位' })
  if (!p.inspector.trim()) errors.push({ field: 'inspector', message: '请输入点检人员' })
  if (!p.operator.trim()) errors.push({ field: 'operator', message: '请选择使用人' })
  if (deriveInspectStatus(p) === '异常' && !p.note?.trim()) {
    errors.push({ field: 'note', message: '存在异常项，请填写异常说明' })
  }
  if (p.note && p.note.length > 200) errors.push({ field: 'note', message: '异常说明不能超过 200 字' })
  if ((p.photos?.length ?? 0) > 3) errors.push({ field: 'photos', message: '现场照片最多 3 张' })
  return { ok: errors.length === 0, errors }
}
