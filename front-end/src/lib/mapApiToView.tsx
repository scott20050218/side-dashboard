import React from 'react';
import { TrendingUp, Zap, ShoppingCart, Home } from 'lucide-react';
import type { Transaction, ManagementItem, User, Role } from '../types';
import type { ApiTransaction, ApiManagementItem, ApiUserRow, ApiRoleRow } from './api';

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function formatDateOnly(iso: string): string {
  return iso.slice(0, 10);
}

export function mapApiTransaction(row: ApiTransaction): Transaction {
  const isIncome = row.kind === 'income';
  const icon = isIncome ? (
    row.title.includes('服务') ? (
      <Zap size={20} />
    ) : (
      <TrendingUp size={20} />
    )
  ) : row.title.includes('房租') ? (
    <Home size={20} />
  ) : (
    <ShoppingCart size={20} />
  );
  const color = isIncome
    ? row.title.includes('服务')
      ? 'bg-primary/20'
      : 'bg-cyan-custom/20'
    : row.title.includes('房租')
      ? 'bg-yellow-custom/20'
      : 'bg-orange-custom/20';

  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    subtitle: row.subtitle,
    amount: row.amount,
    time: formatTime(row.occurredAt),
    date: formatDateOnly(row.occurredAt),
    icon,
    isPositive: row.amount >= 0,
    color,
  };
}

export function mapApiManagementItem(row: ApiManagementItem): ManagementItem {
  return {
    id: row.id,
    title: row.title,
    note: row.note?.trim() ? row.note : undefined,
    status: row.status,
    time: formatTime(row.occurredAt),
    date: formatDateOnly(row.occurredAt),
    type: row.type,
    createdByName: row.createdByName,
    reviewedByName: row.reviewedByName,
    reviewedAt: row.reviewedAt,
    rejectReason: row.rejectReason,
  };
}

export function mapApiUser(row: ApiUserRow): User {
  return {
    id: row.id,
    username: row.username ?? '',
    name: row.name,
    role: row.role,
    roleId: row.roleId ?? '',
    status: row.status,
    avatar: row.avatar,
    email: row.email,
  };
}

export function mapApiRole(row: ApiRoleRow): Role {
  return {
    id: row.id,
    name: row.name,
    permissions: row.permissions,
  };
}
