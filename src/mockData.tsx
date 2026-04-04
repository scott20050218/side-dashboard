import React from 'react';
import { 
  TrendingUp, 
  Zap, 
  ShoppingCart, 
  Home, 
} from 'lucide-react';
import { Transaction, ManagementItem, Ad, User, Role } from './types';

export const MOCK_INCOME: Transaction[] = [
  { id: 'i1', title: '销售收入', subtitle: '线上订单', amount: 1200.00, time: '10:30 AM', date: '2026-04-04', icon: <TrendingUp size={20} />, isPositive: true, color: 'bg-cyan-custom/20' },
  { id: 'i2', title: '服务费', subtitle: '咨询服务', amount: 500.00, time: '09:15 AM', date: '2026-04-04', icon: <Zap size={20} />, isPositive: true, color: 'bg-primary/20' },
  { id: 'i3', title: '旧货回收', subtitle: '废旧设备', amount: 300.00, time: '02:00 PM', date: '2026-04-01', icon: <TrendingUp size={20} />, isPositive: true, color: 'bg-cyan-custom/20' },
];

export const MOCK_EXPENSE: Transaction[] = [
  { id: 'e1', title: '进货支出', subtitle: '原材料采购', amount: -800.00, time: '11:00 AM', date: '2026-04-04', icon: <ShoppingCart size={20} />, isPositive: false, color: 'bg-orange-custom/20' },
  { id: 'e2', title: '房租缴纳', subtitle: '4月房租', amount: -3000.00, time: '昨天', date: '2026-04-03', icon: <Home size={20} />, isPositive: false, color: 'bg-yellow-custom/20' },
  { id: 'e3', title: '水电费', subtitle: '3月结算', amount: -450.00, time: '03:00 PM', date: '2026-03-31', icon: <ShoppingCart size={20} />, isPositive: false, color: 'bg-orange-custom/20' },
];

export const MOCK_MANAGEMENT: ManagementItem[] = [
  { id: 'm1', title: '库存预警：原材料不足', status: '待处理', time: '10:00 AM', date: '2026-04-04', type: 'notification' },
  { id: 'm2', title: '采购申请：办公用品', status: '待审批', time: '09:00 AM', date: '2026-04-04', type: 'approval' },
  { id: 'm3', title: '维修申请：空调故障', status: '已处理', time: '11:00 AM', date: '2026-04-02', type: 'approval' },
];

export const ADS: Ad[] = [
  { id: 1, title: '专业法律顾问', subtitle: '为您的事业保驾护航', color: 'from-primary to-cyan-custom' },
  { id: 2, title: '资深财务专家', subtitle: '精准理财，合规节税', color: 'from-orange-custom to-yellow-custom' },
];

export const MOCK_USERS: User[] = [
  { 
    id: '1', 
    name: '李老板', 
    role: '超级管理员', 
    status: 'active', 
    avatar: 'https://picsum.photos/seed/owner/100/100',
    email: 'owner@example.com'
  },
  { 
    id: '2', 
    name: '张店长', 
    role: '店长', 
    status: 'active', 
    avatar: 'https://picsum.photos/seed/manager/100/100',
    email: 'manager@example.com'
  },
  { 
    id: '3', 
    name: '王收银', 
    role: '收银员', 
    status: 'inactive', 
    avatar: 'https://picsum.photos/seed/cashier/100/100',
    email: 'cashier@example.com'
  }
];

export const MOCK_ROLES: Role[] = [
  { 
    id: '1', 
    name: '超级管理员', 
    permissions: ['查看报表', '录入收支', '事务审批', '用户管理', '权限设置', '系统配置'] 
  },
  { 
    id: '2', 
    name: '店长', 
    permissions: ['查看报表', '录入收支', '事务审批'] 
  },
  { 
    id: '3', 
    name: '收银员', 
    permissions: ['录入收支'] 
  }
];
