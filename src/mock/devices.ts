import type { Device } from '@/types/maintPlan'
export const DEVICES: Device[] = [
  { id:'D001', name:'拖拉机',     code:'TR001',  model:'约翰迪尔 6B-1204', usage:'耕地作业', owner:'张三', type:'拖拉机',  svg:'tractor'   },
  { id:'D002', name:'联合收割机', code:'LHS002', model:'沃得 4LZ-5.0',    usage:'粮食收割', owner:'李四', type:'收割机',  svg:'harvester' },
  { id:'D003', name:'旋耕机',     code:'XGJ003', model:'东风 1GQN-200',   usage:'土地旋耕', owner:'王五', type:'旋耕机',  svg:'tiller'    },
  { id:'D004', name:'水泵',       code:'SB004',  model:'新界 80QZ-60',    usage:'农田灌溉', owner:'赵六', type:'水泵',    svg:'pump'      },
  { id:'D005', name:'撒肥机',     code:'SFJ005', model:'中联 2F-1000',    usage:'施肥作业', owner:'陈七', type:'撒肥机',  svg:'spreader'  },
  { id:'D006', name:'植保无人机', code:'UAV006', model:'大疆 T40',        usage:'植保喷洒', owner:'王强', type:'无人机',  svg:'drone'     }
]
