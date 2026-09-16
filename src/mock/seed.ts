import type { Plan } from '@/types/maintPlan'

const ts = (s: string) => Date.parse(s + 'T08:00:00')

export const SEED_PLANS: Plan[] = [
  {
    id:'1', deviceId:'D001', deviceName:'拖拉机', deviceCode:'TR001', modelSpec:'约翰迪尔 6B-1204', usage:'耕地作业',
    thisDate:'2026-08-10', owner:'张三', status:'undone',
    items:[
      { id:'i1', content:'更换机油与机滤', cycleValue:250, cycleUnit:'小时', nextDate:'2026-10-10' },
      { id:'i2', content:'检查轮胎气压与螺栓紧固', cycleValue:30, cycleUnit:'天', nextDate:'2026-10-25' },
      { id:'i3', content:'清洁空气滤清器', cycleValue:500, cycleUnit:'小时', nextDate:'2026-12-20' }
    ],
    createdAt: ts('2026-08-10'), updatedAt: ts('2026-08-10')
  },
  {
    id:'2', deviceId:'D002', deviceName:'联合收割机', deviceCode:'LHS002', modelSpec:'沃得 4LZ-5.0', usage:'粮食收割',
    thisDate:'2026-08-15', owner:'李四', status:'done',
    items:[
      { id:'i1', content:'割台链条润滑与张紧', cycleValue:200, cycleUnit:'小时', nextDate:'2026-09-30' },
      { id:'i2', content:'脱粒滚筒间隙检查', cycleValue:400, cycleUnit:'小时', nextDate:'2026-11-15' }
    ],
    createdAt: ts('2026-08-15'), updatedAt: ts('2026-08-15')
  },
  {
    id:'3', deviceId:'D003', deviceName:'旋耕机', deviceCode:'XGJ003', modelSpec:'东风 1GQN-200', usage:'土地旋耕',
    thisDate:'2026-08-01', owner:'王五', status:'undone',
    items:[{ id:'i1', content:'旋耕刀片检查更换', cycleValue:100, cycleUnit:'小时', nextDate:'2026-10-01' }],
    createdAt: ts('2026-08-01'), updatedAt: ts('2026-08-01')
  },
  {
    id:'4', deviceId:'D004', deviceName:'水泵', deviceCode:'SB004', modelSpec:'新界 80QZ-60', usage:'农田灌溉',
    thisDate:'2026-07-20', owner:'赵六', status:'undone',
    items:[{ id:'i1', content:'轴承润滑与密封检查', cycleValue:500, cycleUnit:'小时', nextDate:'2026-12-20' }],
    createdAt: ts('2026-07-20'), updatedAt: ts('2026-07-20')
  },
  {
    id:'5', deviceId:'D005', deviceName:'撒肥机', deviceCode:'SFJ005', modelSpec:'中联 2F-1000', usage:'施肥作业',
    thisDate:'2026-08-12', owner:'陈七', status:'done',
    items:[{ id:'i1', content:'撒播链条张紧与润滑', cycleValue:300, cycleUnit:'小时', nextDate:'2026-11-12' }],
    createdAt: ts('2026-08-12'), updatedAt: ts('2026-08-12')
  },
  {
    id:'6', deviceId:'D006', deviceName:'植保无人机', deviceCode:'UAV006', modelSpec:'大疆 T40', usage:'植保喷洒',
    thisDate:'2026-06-10', owner:'王强', status:'undone',
    items:[
      { id:'i1', content:'桨叶检查更换', cycleValue:60, cycleUnit:'天', nextDate:'2026-09-10' },
      { id:'i2', content:'喷洒系统校准', cycleValue:90, cycleUnit:'天', nextDate:'2026-11-01' }
    ],
    createdAt: ts('2026-06-10'), updatedAt: ts('2026-06-10')
  }
]
