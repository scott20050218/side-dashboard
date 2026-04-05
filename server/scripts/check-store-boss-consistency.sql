-- =============================================================================
-- 门店店主一致性（SQLite）— 以 store_members.role_id 对应 roles.name =「老板」为准
-- （老板角色 id 一般为 5，建议以 roles 表为准）
-- =============================================================================
-- 用法：sqlite3 ./data/app.db < server/scripts/check-store-boss-consistency.sql
-- =============================================================================

.headers on
.mode column

SELECT '--- [1] 无「老板」成员行的门店（无法认定店主）---' AS section;

SELECT
  s.id AS store_id,
  s.name AS store_name
FROM stores s
WHERE NOT EXISTS (
  SELECT 1
  FROM store_members sm
  JOIN roles r ON r.id = sm.role_id
  WHERE sm.store_id = s.id AND r.name = '老板'
);

SELECT '--- [2] 同一门店多条「老板」成员行（业务上通常只应有一名店主）---' AS section;

SELECT sm.store_id, COUNT(*) AS boss_rows
FROM store_members sm
JOIN roles r ON r.id = sm.role_id
WHERE r.name = '老板'
GROUP BY sm.store_id
HAVING COUNT(*) > 1;

SELECT '--- [3] 全局角色「老板」但在某店成员角色不是「老板」（团队管理可能异常）---' AS section;

SELECT
  u.id AS user_id,
  u.username,
  u.name AS display_name,
  s.id AS store_id,
  s.name AS store_name,
  mr.name AS member_role
FROM users u
JOIN roles gr ON gr.id = u.role_id
JOIN store_members m ON m.user_id = u.id
JOIN stores s ON s.id = m.store_id
JOIN roles mr ON mr.id = m.role_id
WHERE gr.name = '老板'
  AND mr.name != '老板'
ORDER BY u.username, s.name;

SELECT '--- [4] 本店「老板」成员与其 users.role_id 对照（可选核对）---' AS section;

SELECT
  sm.store_id,
  s.name AS store_name,
  sm.user_id,
  u.username,
  u.name AS user_name,
  gr.name AS global_role,
  mr.name AS member_role
FROM store_members sm
JOIN roles mr ON mr.id = sm.role_id AND mr.name = '老板'
JOIN stores s ON s.id = sm.store_id
JOIN users u ON u.id = sm.user_id
JOIN roles gr ON gr.id = u.role_id
ORDER BY s.name, u.username;
