import React from 'react';

export type View = 'login' | 'home' | 'income' | 'expense' | 'management' | 'account_detail' | 'monthly_flow' | 'report' | 'stats' | 'user_management' | 'auth_management' | 'profile';

export interface User {
  id: string;
  name: string;
  role: string;
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
  status: string;
  time: string;
  date: string; // YYYY-MM-DD
  type: 'notification' | 'approval';
}

export interface Ad {
  id: number;
  title: string;
  subtitle: string;
  color: string;
}
