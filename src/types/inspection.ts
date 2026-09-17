export type CheckResult = '正常' | '异常'

export interface InspectRecord {
  id: string
  date: string               // 点检日期 YYYY-MM-DD
  deviceCode: string         // 设备编号（picker 选择）
  deviceName: string         // 设备名称（选编号后带出，快照存储）
  meterResult: CheckResult   // 仪表检查
  vehicleResult: CheckResult // 车况检查
  vehicleStatus: CheckResult // 车辆状态
  durationValue: number      // 使用时长数值（>0，最多一位小数）
  durationUnit: string       // 使用时长单位（字典 usage_duration_unit）
  inspector: string          // 点检人员（默认当前登录用户，可编辑）
  operator: string           // 使用人（选设备后带出负责人，可改）
  note?: string              // 异常说明（任一异常时必填，≤200 字）
  photos?: string[]          // 现场照片 dataURL（≤3 张）
  createdAt: number
}

export interface InspectRecordDerived extends InspectRecord {
  status: CheckResult        // 派生：三项任一异常 → 异常
  deviceSvg?: string         // mock 联表 DEVICES 注入插画 kind
}

export type InspectPayload = Omit<InspectRecord, 'id' | 'createdAt'>
