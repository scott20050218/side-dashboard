import React from 'react';

export type View =
  | 'login'
  | 'home'
  | 'income'
  | 'expense'
  | 'management'
  | 'account_detail'
  | 'monthly_flow'
  | 'report'
  | 'user_management'
  | 'auth_management'
  | 'admin_stores'
  | 'store_team'
  | 'profile'
  | 'amendments';

export interface User {
  id: string;
  username: string;
  name: string;
  role: string;
  /** 来自 /api/users 的 role_id，用于编辑表单 */
  roleId: string;
  status: 'active' | 'inactive';
  avatar: string;
  email: string;
}

export interface Role {
  id: string;
  name: string;
  permissions: string[];
}

export interface Transaction {
  id: string;
  kind?: 'income' | 'expense';
  title: string;
  subtitle: string;
  amount: number;
  time: string;
  date: string; // YYYY-MM-DD
  icon: React.ReactNode;
  isPositive: boolean;
  color: string;
}

export interface ManagementItem {
  id: string;
  title: string;
  /** 提交时填写的备注 / 详情 */
  note?: string;
  status: string;
  time: string;
  date: string; // YYYY-MM-DD
  type: 'notification' | 'approval';
  createdByName?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  rejectReason?: string;
}
