# 门店店主与「我的团队」

店主能力（`assertStoreOwnerOrAdmin`、登录里的 `canManageStoreTeam`）仅当：

1. 全局 **超级管理员**，或  
2. 在本店 **`store_members.role_id` 对应 `roles.name = '老板'`**（种子数据里老板角色 id 为 `5`）。

`stores` 表**不**存放店主用户 id；超管代建门店时，所选用户通过 **`store_members` 写入 `role_id` 指向「老板」**。`stores.created_by_admin_id` 仅审计，不参与权限。

门店成员与账号全局角色共用 **`roles` 表**：同一用户在店内的 `store_members.role_id` 与 `users.role_id` 在业务上应保持一致（多店场景以各店成员行为准）。

## 检查脚本

```bash
sqlite3 server/data/app.db < server/scripts/check-store-boss-consistency.sql
```

见脚本内分段说明：无老板成员行的门店、同一店多条老板成员、全局老板与店内角色不一致等。

## 数据修复（先备份）

将某用户设为本店唯一店主（若已是成员则更新角色，否则插入）。老板角色 id 以库内 `roles` 为准（常见为 `5`）：

```sql
BEGIN;
INSERT INTO store_members (user_id, store_id, role_id, can_view_overview, can_view_transaction_lines, can_record, created_at)
VALUES ('<USER_ID>', '<STORE_ID>', '5', 1, 1, 1, datetime('now'))
ON CONFLICT(user_id, store_id) DO UPDATE SET
  role_id = '5',
  can_view_overview = 1,
  can_view_transaction_lines = 1,
  can_record = 1;
UPDATE users SET role_id = '5' WHERE id = '<USER_ID>';
COMMIT;
```

若需撤换店主，将原店主成员行的 `role_id` 改为店长/收银员/股东等，并保证该店仍至少有一条「老板」成员行。

## 去掉 `stores.owner_user_id` 后仍看到该列？

迁移在**每次进程启动**、打开 SQLite 时执行。请先**完全停止再启动** API（避免旧进程占库）。若仍保留旧列，常见原因是曾有一次迁移在 `store_members.can_record` 尚未创建时失败（旧顺序问题）；当前代码已先执行 `ensureStoreMemberCanRecord` 再删列。升级后重启一次即可；库文件路径以环境变量 `DATABASE_PATH` 为准。

启动日志出现 `[db] stores: removed legacy owner column` 表示本库已完成表重建。另支持误拼列名 `ower_user_id`（若存在会一并迁出并删除）。

## 相关代码

- `server/src/lib/storeAuth.ts` — `assertStoreOwnerOrAdmin`  
- `server/src/db.ts` — `migrateStoresRemoveOwnerUserId`、`migrateStoreMembersRoleId`  
- `server/src/routes/auth.ts`、`stores.ts` — 登录与 `/stores/mine`  
- `front-end/src/lib/api.ts` — `isUserBossOfStore`
