import type { Plan } from '@/types/maintPlan'

export interface ValidationError { field: string; message: string; itemIndex?: number }
export interface ValidationResult { ok: boolean; errors: ValidationError[] }

const CYCLE_RE = /^[1-9]\d*$/

export function validatePlan(p: Plan): ValidationResult {
  const errors: ValidationError[] = []
  if (!p.deviceName.trim()) errors.push({ field:'deviceName', message:'请输入设备名称' })
  if (!p.deviceCode.trim()) errors.push({ field:'deviceCode', message:'请输入设备编号' })
  if (!p.modelSpec.trim()) errors.push({ field:'modelSpec', message:'请输入型号规格' })
  if (!p.usage.trim()) errors.push({ field:'usage', message:'请输入设备用途' })
  if (!p.thisDate) errors.push({ field:'thisDate', message:'请选择本次保养时间' })
  if (!p.owner.trim()) errors.push({ field:'owner', message:'请输入责任人' })
  if (!p.items.length) errors.push({ field:'items', message:'至少 1 项保养' })
  p.items.forEach((it, idx) => {
    if (!it.content.trim()) errors.push({ field:'items.content', message:`第 ${idx+1} 项保养内容不能为空`, itemIndex: idx })
    if (!CYCLE_RE.test(String(it.cycleValue))) errors.push({ field:'items.cycleValue', message:`第 ${idx+1} 项保养周期必须为正整数`, itemIndex: idx })
    if (!it.nextDate) errors.push({ field:'items.nextDate', message:`第 ${idx+1} 项请选择下次保养时间`, itemIndex: idx })
    else if (p.thisDate && it.nextDate <= p.thisDate) errors.push({ field:'items.nextDate', message:`第 ${idx+1} 项下次保养时间需晚于本次保养时间`, itemIndex: idx })
  })
  return { ok: errors.length === 0, errors }
}
