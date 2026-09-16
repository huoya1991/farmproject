export type CycleUnit = '小时' | '天' | '公里'

export interface MaintItem {
  id: string
  content: string
  cycleValue: number
  cycleUnit: CycleUnit
  nextDate: string  // YYYY-MM-DD
}

export interface Plan {
  id: string
  deviceId: string | null
  deviceName: string
  deviceCode: string
  modelSpec: string
  usage: string
  thisDate: string   // YYYY-MM-DD
  owner: string
  status: 'undone' | 'done'
  items: MaintItem[]
  createdAt: number
  updatedAt: number
}

export interface PlanWithDerived extends Plan {
  planNextDate: string
  overdue: boolean
  lastDate: string | null
  /** 服务端联表设备台账注入（列表卡片筛选与插画用），手动录入设备时为空 */
  deviceType?: string
  deviceSvg?: string
}

export interface Device {
  id: string; name: string; code: string; model: string; usage: string; owner: string
  type: string   // 设备类型（列表筛选用，如「拖拉机」）
  svg: string    // 插画键（DeviceSvg 组件按此渲染）
  photo?: string
}
