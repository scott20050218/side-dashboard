import type Database from 'better-sqlite3';

/**
 * 门店权限模型（简要）：
 * - 超级管理员：全局，进店等同全权限。
 * - 老板/店长/收银员/股东：与 users.role_id 同一套 roles；本店关系在 store_members.role_id。
 * - 店内「录入 / 看概览 / 看流水」由 can_record 等列授权。
 */
interface StoreMembershipRow {
  store_id: string;
  role_id: string;
  role_name: string;
  can_view_overview: number;
  can_view_transaction_lines: number;
  can_record: number;
}

export function isSuperAdmin(db: Database.Database, userId: string): boolean {
  const row = db
    .prepare(
      `SELECT r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?`,
    )
    .get(userId) as { role_name: string } | undefined;
  return row?.role_name === '超级管理员';
}

export function getUserGlobalRoleName(db: Database.Database, userId: string): string | undefined {
  const row = db
    .prepare(`SELECT r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?`)
    .get(userId) as { role_name: string } | undefined;
  return row?.role_name;
}

export function isStoreBossRoleName(roleName: string | undefined): boolean {
  return roleName === '老板';
}

/** 店长/收银员：middleware 里与 can_record 等组合计算「店员类」权限 */
export function isStoreLineScopedStaff(roleName: string | undefined): boolean {
  return roleName === '店长' || roleName === '收银员';
}

export function isStoreManagerRoleName(roleName: string | undefined): boolean {
  return roleName === '店长';
}

export function isStoreCashierRoleName(roleName: string | undefined): boolean {
  return roleName === '收银员';
}

/**
 * 收支流水（及同口径汇总）是否仅本人数据：
 * - 收银员：始终仅本人
 * - 股东：未开「全店流水」时仅本人
 * - 老板、店长：全店（不按本人过滤）
 */
export function restrictStoreTransactionsToOwnUser(
  storeRole: string | undefined,
  ctx: { isSuperAdmin: boolean; canViewTransactionLines: boolean },
): boolean {
  if (ctx.isSuperAdmin) return false;
  if (isStoreCashierRoleName(storeRole)) return true;
  if (isStoreShareholderRoleName(storeRole) && !ctx.canViewTransactionLines) return true;
  return false;
}

export function isStoreShareholderRoleName(roleName: string | undefined): boolean {
  return roleName === '股东';
}

export function getStoreMembership(
  db: Database.Database,
  userId: string,
  storeId: string,
): StoreMembershipRow | undefined {
  return db
    .prepare(
      `SELECT m.store_id, m.role_id, r.name as role_name, m.can_view_overview, m.can_view_transaction_lines,
              COALESCE(m.can_record, 0) as can_record
       FROM store_members m
       JOIN roles r ON r.id = m.role_id
       WHERE m.user_id = ? AND m.store_id = ?`,
    )
    .get(userId, storeId) as StoreMembershipRow | undefined;
}

export function assertStoreOwnerOrAdmin(
  db: Database.Database,
  userId: string,
  storeId: string,
): boolean {
  if (isSuperAdmin(db, userId)) return true;
  const m = getStoreMembership(db, userId, storeId);
  return isStoreBossRoleName(m?.role_name);
}
