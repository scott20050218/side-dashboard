import fs from 'fs';
import path from 'path';
import { randomUUID } from 'node:crypto';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

let db: Database.Database | null = null;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  permissions TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role_id TEXT NOT NULL REFERENCES roles(id),
  status TEXT NOT NULL DEFAULT 'active',
  avatar_url TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  kind TEXT NOT NULL CHECK(kind IN ('income','expense')),
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  amount REAL NOT NULL,
  occurred_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_kind ON transactions(user_id, kind);
CREATE INDEX IF NOT EXISTS idx_transactions_occurred ON transactions(occurred_at);

CREATE TABLE IF NOT EXISTS management_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT '待处理',
  type TEXT NOT NULL CHECK(type IN ('notification','approval')),
  occurred_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_management_user ON management_items(user_id);
`;

function seedIfEmpty(database: Database.Database) {
  const count = database.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number };
  if (count.c > 0) return;

  const now = new Date().toISOString();
  const roles = [
    {
      id: '1',
      name: '超级管理员',
      permissions: JSON.stringify([
        '查看报表',
        '录入收支',
        '事务审批',
        '用户管理',
        '权限设置',
        '系统配置',
      ]),
    },
    {
      id: '2',
      name: '店长',
      permissions: JSON.stringify(['查看报表', '录入收支', '事务审批']),
    },
    {
      id: '3',
      name: '收银员',
      permissions: JSON.stringify(['录入收支']),
    },
  ];

  const insertRole = database.prepare(
    'INSERT INTO roles (id, name, permissions) VALUES (@id, @name, @permissions)',
  );
  for (const r of roles) insertRole.run(r);

  const adminId = randomUUID();
  const hash = bcrypt.hashSync('123456', 10);
  database
    .prepare(
      `INSERT INTO users (id, username, email, password_hash, name, role_id, status, avatar_url, created_at)
       VALUES (@id, @username, @email, @password_hash, @name, @role_id, @status, @avatar_url, @created_at)`,
    )
    .run({
      id: adminId,
      username: 'admin',
      email: 'owner@example.com',
      password_hash: hash,
      name: '李老板',
      role_id: '1',
      status: 'active',
      avatar_url: 'https://picsum.photos/seed/owner/100/100',
      created_at: now,
    });

  const managerId = randomUUID();
  const cashierId = randomUUID();
  database
    .prepare(
      `INSERT INTO users (id, username, email, password_hash, name, role_id, status, avatar_url, created_at)
       VALUES (@id, @username, @email, @password_hash, @name, @role_id, @status, @avatar_url, @created_at)`,
    )
    .run({
      id: managerId,
      username: 'manager',
      email: 'manager@example.com',
      password_hash: bcrypt.hashSync('123456', 10),
      name: '张店长',
      role_id: '2',
      status: 'active',
      avatar_url: 'https://picsum.photos/seed/manager/100/100',
      created_at: now,
    });
  database
    .prepare(
      `INSERT INTO users (id, username, email, password_hash, name, role_id, status, avatar_url, created_at)
       VALUES (@id, @username, @email, @password_hash, @name, @role_id, @status, @avatar_url, @created_at)`,
    )
    .run({
      id: cashierId,
      username: 'cashier',
      email: 'cashier@example.com',
      password_hash: bcrypt.hashSync('123456', 10),
      name: '王收银',
      role_id: '3',
      status: 'inactive',
      avatar_url: 'https://picsum.photos/seed/cashier/100/100',
      created_at: now,
    });

  const txInsert = database.prepare(
    `INSERT INTO transactions (id, user_id, kind, title, subtitle, amount, occurred_at, created_at)
     VALUES (@id, @user_id, @kind, @title, @subtitle, @amount, @occurred_at, @created_at)`,
  );
  const samples: Array<{
    id: string;
    kind: 'income' | 'expense';
    title: string;
    subtitle: string;
    amount: number;
    occurred_at: string;
  }> = [
    {
      id: randomUUID(),
      kind: 'income',
      title: '销售收入',
      subtitle: '线上订单',
      amount: 1200,
      occurred_at: '2026-04-04T10:30:00.000Z',
    },
    {
      id: randomUUID(),
      kind: 'income',
      title: '服务费',
      subtitle: '咨询服务',
      amount: 500,
      occurred_at: '2026-04-04T09:15:00.000Z',
    },
    {
      id: randomUUID(),
      kind: 'income',
      title: '旧货回收',
      subtitle: '废旧设备',
      amount: 300,
      occurred_at: '2026-04-01T14:00:00.000Z',
    },
    {
      id: randomUUID(),
      kind: 'expense',
      title: '进货支出',
      subtitle: '原材料采购',
      amount: -800,
      occurred_at: '2026-04-04T11:00:00.000Z',
    },
    {
      id: randomUUID(),
      kind: 'expense',
      title: '房租缴纳',
      subtitle: '4月房租',
      amount: -3000,
      occurred_at: '2026-04-03T12:00:00.000Z',
    },
    {
      id: randomUUID(),
      kind: 'expense',
      title: '水电费',
      subtitle: '3月结算',
      amount: -450,
      occurred_at: '2026-03-31T15:00:00.000Z',
    },
  ];
  for (const t of samples) {
    txInsert.run({
      ...t,
      user_id: adminId,
      created_at: now,
    });
  }

  const mgInsert = database.prepare(
    `INSERT INTO management_items (id, user_id, title, status, type, occurred_at, created_at)
     VALUES (@id, @user_id, @title, @status, @type, @occurred_at, @created_at)`,
  );
  const items = [
    {
      id: randomUUID(),
      title: '库存预警：原材料不足',
      status: '待处理',
      type: 'notification' as const,
      occurred_at: '2026-04-04T10:00:00.000Z',
    },
    {
      id: randomUUID(),
      title: '采购申请：办公用品',
      status: '待审批',
      type: 'approval' as const,
      occurred_at: '2026-04-04T09:00:00.000Z',
    },
    {
      id: randomUUID(),
      title: '维修申请：空调故障',
      status: '已处理',
      type: 'approval' as const,
      occurred_at: '2026-04-02T11:00:00.000Z',
    },
  ];
  for (const m of items) {
    mgInsert.run({ ...m, user_id: adminId, created_at: now });
  }
}

export function getDb(databasePath: string): Database.Database {
  if (db) return db;

  const dir = path.dirname(path.resolve(databasePath));
  fs.mkdirSync(dir, { recursive: true });

  db = new Database(databasePath);
  db.pragma('journal_mode = WAL');
  db.exec(SCHEMA);
  seedIfEmpty(db);
  return db;
}
