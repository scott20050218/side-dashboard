import fs from 'fs';
import path from 'path';
import { randomUUID } from 'node:crypto';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

let db: Database.Database | null = null;

const CORE_SCHEMA = `
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

CREATE TABLE IF NOT EXISTS stores (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  created_by_admin_id TEXT REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS store_members (
  user_id TEXT NOT NULL REFERENCES users(id),
  store_id TEXT NOT NULL REFERENCES stores(id),
  role_id TEXT NOT NULL REFERENCES roles(id),
  can_view_overview INTEGER NOT NULL DEFAULT 0,
  can_view_transaction_lines INTEGER NOT NULL DEFAULT 0,
  can_record INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, store_id)
);

CREATE INDEX IF NOT EXISTS idx_store_members_store ON store_members(store_id);
CREATE INDEX IF NOT EXISTS idx_store_members_user ON store_members(user_id);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL REFERENCES stores(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  kind TEXT NOT NULL CHECK(kind IN ('income','expense')),
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  amount REAL NOT NULL,
  occurred_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transactions_store_kind ON transactions(store_id, kind);
CREATE INDEX IF NOT EXISTS idx_transactions_occurred ON transactions(occurred_at);
CREATE INDEX IF NOT EXISTS idx_transactions_store_user ON transactions(store_id, user_id);

CREATE TABLE IF NOT EXISTS transaction_amendments (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL REFERENCES transactions(id),
  store_id TEXT NOT NULL REFERENCES stores(id),
  requested_by TEXT NOT NULL REFERENCES users(id),
  payload TEXT NOT NULL,
  previous_snapshot TEXT,
  status TEXT NOT NULL CHECK(status IN ('pending','approved','rejected')),
  reviewed_by TEXT REFERENCES users(id),
  reviewed_at TEXT,
  reject_reason TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_amendments_store_status ON transaction_amendments(store_id, status);

CREATE TABLE IF NOT EXISTS management_items (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL REFERENCES stores(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT '待审批',
  type TEXT NOT NULL CHECK(type IN ('notification','approval')),
  occurred_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  reviewed_by TEXT REFERENCES users(id),
  reviewed_at TEXT,
  reject_reason TEXT,
  note TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_management_store ON management_items(store_id);
`;

function tableExists(database: Database.Database, name: string): boolean {
  const row = database
    .prepare(`SELECT 1 as x FROM sqlite_master WHERE type='table' AND name=?`)
    .get(name) as { x: number } | undefined;
  return Boolean(row);
}

function columnExists(database: Database.Database, table: string, col: string): boolean {
  const rows = database.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  return rows.some((r) => r.name === col);
}

function migrateLegacy(database: Database.Database) {
  database.pragma('foreign_keys = OFF');

  if (!tableExists(database, 'stores')) {
    database.exec(`
      CREATE TABLE stores (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL,
        created_by_admin_id TEXT REFERENCES users(id)
      );
      CREATE TABLE store_members (
        user_id TEXT NOT NULL REFERENCES users(id),
        store_id TEXT NOT NULL REFERENCES stores(id),
        role_id TEXT NOT NULL REFERENCES roles(id),
        can_view_overview INTEGER NOT NULL DEFAULT 0,
        can_view_transaction_lines INTEGER NOT NULL DEFAULT 0,
        can_record INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        PRIMARY KEY (user_id, store_id)
      );
      CREATE INDEX idx_store_members_store ON store_members(store_id);
      CREATE INDEX idx_store_members_user ON store_members(user_id);
    `);
  }

  if (!tableExists(database, 'transaction_amendments')) {
    database.exec(`
      CREATE TABLE transaction_amendments (
        id TEXT PRIMARY KEY,
        transaction_id TEXT NOT NULL,
        store_id TEXT NOT NULL REFERENCES stores(id),
        requested_by TEXT NOT NULL REFERENCES users(id),
        payload TEXT NOT NULL,
        previous_snapshot TEXT,
        status TEXT NOT NULL CHECK(status IN ('pending','approved','rejected')),
        reviewed_by TEXT REFERENCES users(id),
        reviewed_at TEXT,
        reject_reason TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (transaction_id) REFERENCES transactions(id)
      );
      CREATE INDEX idx_amendments_store_status ON transaction_amendments(store_id, status);
    `);
  }

  const hadTransactions = tableExists(database, 'transactions');
  if (hadTransactions && !columnExists(database, 'transactions', 'store_id')) {
    database.exec('ALTER TABLE transactions ADD COLUMN store_id TEXT REFERENCES stores(id)');
  }

  if (tableExists(database, 'management_items') && !columnExists(database, 'management_items', 'store_id')) {
    database.exec('ALTER TABLE management_items ADD COLUMN store_id TEXT REFERENCES stores(id)');
  }

  if (tableExists(database, 'management_items')) {
    if (!columnExists(database, 'management_items', 'reviewed_by')) {
      database.exec('ALTER TABLE management_items ADD COLUMN reviewed_by TEXT REFERENCES users(id)');
    }
    if (!columnExists(database, 'management_items', 'reviewed_at')) {
      database.exec('ALTER TABLE management_items ADD COLUMN reviewed_at TEXT');
    }
    if (!columnExists(database, 'management_items', 'reject_reason')) {
      database.exec('ALTER TABLE management_items ADD COLUMN reject_reason TEXT');
    }
    if (!columnExists(database, 'management_items', 'note')) {
      database.exec(`ALTER TABLE management_items ADD COLUMN note TEXT NOT NULL DEFAULT ''`);
    }
  }

  const storeCount = (database.prepare('SELECT COUNT(*) as c FROM stores').get() as { c: number }).c;
  if (storeCount === 0 && tableExists(database, 'users')) {
    const uCount = (database.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }).c;
    if (uCount > 0) {
      const adminRow = database
        .prepare(
          `SELECT u.id FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = '超级管理员' LIMIT 1`,
        )
        .get() as { id: string } | undefined;
      const ownerId =
        adminRow?.id ??
        (database.prepare('SELECT id FROM users ORDER BY created_at LIMIT 1').get() as { id: string }).id;
      const now = new Date().toISOString();
      const sid = randomUUID();
      database
        .prepare(`INSERT INTO stores (id, name, created_at) VALUES (?, ?, ?)`)
        .run(sid, '默认门店', now);

      const allUsers = database.prepare('SELECT id, role_id FROM users').all() as Array<{
        id: string;
        role_id: string;
      }>;
      const insertM = database.prepare(
        `INSERT OR IGNORE INTO store_members (user_id, store_id, role_id, can_view_overview, can_view_transaction_lines, can_record, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      );
      for (const u of allUsers) {
        const rid = u.id === ownerId ? '5' : u.role_id;
        const isBoss = u.id === ownerId;
        const ov = isBoss ? 1 : 0;
        const lines = isBoss ? 1 : 0;
        const rec = isBoss || ['2', '3'].includes(u.role_id) ? 1 : 0;
        insertM.run(u.id, sid, rid, ov, lines, rec, now);
      }

      if (columnExists(database, 'transactions', 'store_id')) {
        database.prepare(`UPDATE transactions SET store_id = ? WHERE store_id IS NULL`).run(sid);
      }
      if (columnExists(database, 'management_items', 'store_id')) {
        database.prepare(`UPDATE management_items SET store_id = ? WHERE store_id IS NULL`).run(sid);
      }
    }
  }

  database.pragma('foreign_keys = ON');
}

/** 旧列名 owner_user_id；若曾误建为 ower_user_id 也一并处理 */
function storesLegacyOwnerColumn(database: Database.Database): 'owner_user_id' | 'ower_user_id' | null {
  if (columnExists(database, 'stores', 'owner_user_id')) return 'owner_user_id';
  if (columnExists(database, 'stores', 'ower_user_id')) return 'ower_user_id';
  return null;
}

/** 从旧版 stores 的店主列迁出：补全 store_members.owner 后删列（SQLite 表重建） */
function migrateStoresRemoveOwnerUserId(database: Database.Database) {
  if (!tableExists(database, 'stores')) return;
  const ownerCol = storesLegacyOwnerColumn(database);
  if (!ownerCol) return;

  database.pragma('foreign_keys = OFF');
  const now = new Date().toISOString();
  const rows = database
    .prepare(`SELECT id, "${ownerCol}" AS legacy_owner_id FROM stores`)
    .all() as Array<{ id: string; legacy_owner_id: string }>;

  const hasOwnerRow = database.prepare(
    `SELECT 1 FROM store_members WHERE store_id = ? AND role_id = '5' LIMIT 1`,
  );
  const upsertOwner = database.prepare(
    `INSERT INTO store_members (user_id, store_id, role_id, can_view_overview, can_view_transaction_lines, can_record, created_at)
     VALUES (?, ?, '5', 1, 1, 1, ?)
     ON CONFLICT(user_id, store_id) DO UPDATE SET
       role_id = '5',
       can_view_overview = excluded.can_view_overview,
       can_view_transaction_lines = excluded.can_view_transaction_lines,
       can_record = excluded.can_record`,
  );

  for (const r of rows) {
    const ou = (r.legacy_owner_id ?? '').trim();
    if (!ou) continue;
    if (!hasOwnerRow.get(r.id)) {
      upsertOwner.run(ou, r.id, now);
    }
  }

  const hasCreatedBy = columnExists(database, 'stores', 'created_by_admin_id');
  database.exec(`
    CREATE TABLE stores__migrated (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      created_by_admin_id TEXT REFERENCES users(id)
    )
  `);
  if (hasCreatedBy) {
    database.exec(
      `INSERT INTO stores__migrated (id, name, created_at, created_by_admin_id)
       SELECT id, name, created_at, created_by_admin_id FROM stores`,
    );
  } else {
    database.exec(
      `INSERT INTO stores__migrated (id, name, created_at, created_by_admin_id)
       SELECT id, name, created_at, NULL FROM stores`,
    );
  }
  database.exec(`DROP TABLE stores`);
  database.exec(`ALTER TABLE stores__migrated RENAME TO stores`);
  database.pragma('foreign_keys = ON');
  console.info('[db] stores: removed legacy owner column; owner is store_members.role_id=老板(5)');
}

/** 将 store_role(owner/employee/shareholder) 迁为 role_id，与 users 共用 roles 表 */
function migrateStoreMembersRoleId(database: Database.Database) {
  if (!tableExists(database, 'store_members')) return;
  if (!columnExists(database, 'store_members', 'store_role')) return;

  database.pragma('foreign_keys = OFF');
  if (!columnExists(database, 'store_members', 'role_id')) {
    database.exec(`ALTER TABLE store_members ADD COLUMN role_id TEXT REFERENCES roles(id)`);
  }
  database.exec(`
    UPDATE store_members SET role_id = CASE store_role
      WHEN 'owner' THEN '5'
      WHEN 'shareholder' THEN '4'
      ELSE COALESCE((SELECT u.role_id FROM users u WHERE u.id = store_members.user_id), '2')
    END
    WHERE role_id IS NULL
  `);
  database.exec(`UPDATE store_members SET role_id = '2' WHERE role_id IS NULL`);

  database.exec(`
    CREATE TABLE store_members__new (
      user_id TEXT NOT NULL REFERENCES users(id),
      store_id TEXT NOT NULL REFERENCES stores(id),
      role_id TEXT NOT NULL REFERENCES roles(id),
      can_view_overview INTEGER NOT NULL DEFAULT 0,
      can_view_transaction_lines INTEGER NOT NULL DEFAULT 0,
      can_record INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      PRIMARY KEY (user_id, store_id)
    )
  `);
  database.exec(`
    INSERT INTO store_members__new
    SELECT user_id, store_id, role_id, can_view_overview, can_view_transaction_lines,
           COALESCE(can_record, 0), created_at
    FROM store_members
  `);
  database.exec(`DROP TABLE store_members`);
  database.exec(`ALTER TABLE store_members__new RENAME TO store_members`);
  database.exec(`CREATE INDEX IF NOT EXISTS idx_store_members_store ON store_members(store_id)`);
  database.exec(`CREATE INDEX IF NOT EXISTS idx_store_members_user ON store_members(user_id)`);
  database.pragma('foreign_keys = ON');
  console.info('[db] store_members: store_role → role_id（老板/店长/收银员/股东）');
}

function ensureFreshTransactionsTable(database: Database.Database) {
  if (!tableExists(database, 'transactions')) {
    database.exec(`
      CREATE TABLE transactions (
        id TEXT PRIMARY KEY,
        store_id TEXT NOT NULL REFERENCES stores(id),
        user_id TEXT NOT NULL REFERENCES users(id),
        kind TEXT NOT NULL CHECK(kind IN ('income','expense')),
        title TEXT NOT NULL,
        subtitle TEXT NOT NULL DEFAULT '',
        amount REAL NOT NULL,
        occurred_at TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE INDEX idx_transactions_store_kind ON transactions(store_id, kind);
      CREATE INDEX idx_transactions_occurred ON transactions(occurred_at);
      CREATE INDEX idx_transactions_store_user ON transactions(store_id, user_id);
    `);
  }
}

function ensureFreshManagementTable(database: Database.Database) {
  if (!tableExists(database, 'management_items')) {
    database.exec(`
      CREATE TABLE management_items (
        id TEXT PRIMARY KEY,
        store_id TEXT NOT NULL REFERENCES stores(id),
        user_id TEXT NOT NULL REFERENCES users(id),
        title TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT '待审批',
        type TEXT NOT NULL CHECK(type IN ('notification','approval')),
        occurred_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        reviewed_by TEXT REFERENCES users(id),
        reviewed_at TEXT,
        reject_reason TEXT,
        note TEXT NOT NULL DEFAULT ''
      );
      CREATE INDEX idx_management_store ON management_items(store_id);
    `);
  }
}

function ensureShareholderRole(database: Database.Database) {
  if (!tableExists(database, 'roles')) return;
  const row = database.prepare(`SELECT 1 as x FROM roles WHERE id = ?`).get('4') as { x: number } | undefined;
  if (!row) {
    database
      .prepare(`INSERT INTO roles (id, name, permissions) VALUES (?, ?, ?)`)
      .run('4', '股东', JSON.stringify(['查看报表']));
  }
  database
    .prepare(
      `UPDATE users SET role_id = '4' WHERE username = 'shareholder' AND EXISTS (SELECT 1 FROM roles WHERE id = '4')`,
    )
    .run();
}

function ensureBossRole(database: Database.Database) {
  if (!tableExists(database, 'roles')) return;
  const row = database.prepare(`SELECT 1 as x FROM roles WHERE id = ?`).get('5') as { x: number } | undefined;
  if (!row) {
    database
      .prepare(`INSERT INTO roles (id, name, permissions) VALUES (?, ?, ?)`)
      .run(
        '5',
        '老板',
        JSON.stringify(['查看报表', '录入收支', '事务审批', '门店团队管理']),
      );
  }
}

/** 录入权限由门店老板授权；店长/收银员/股东在店内的查看与录入均走这三列 + can_record */
function ensureStoreMemberCanRecord(database: Database.Database) {
  if (!tableExists(database, 'store_members')) return;
  if (columnExists(database, 'store_members', 'can_record')) return;
  database.exec(`ALTER TABLE store_members ADD COLUMN can_record INTEGER NOT NULL DEFAULT 0`);
  if (columnExists(database, 'store_members', 'store_role')) {
    database.exec(
      `UPDATE store_members SET can_record = 1 WHERE store_role IN ('owner', 'employee')`,
    );
    database.exec(
      `UPDATE store_members SET can_view_overview = 1, can_view_transaction_lines = 1 WHERE store_role = 'employee'`,
    );
  } else {
    database.exec(`UPDATE store_members SET can_record = 1 WHERE role_id IN ('2','3','5')`);
    database.exec(
      `UPDATE store_members SET can_view_overview = 1, can_view_transaction_lines = 1 WHERE role_id IN ('2','3')`,
    );
  }
}

function runMigrations(database: Database.Database) {
  database.exec(CORE_SCHEMA);
  migrateLegacy(database);
  /** 须先于 role 迁移与删 owner 列：迁移里 INSERT 依赖 can_record */
  ensureStoreMemberCanRecord(database);
  migrateStoreMembersRoleId(database);
  migrateStoresRemoveOwnerUserId(database);
  if (!tableExists(database, 'transactions')) {
    ensureFreshTransactionsTable(database);
  }
  if (!tableExists(database, 'management_items')) {
    ensureFreshManagementTable(database);
  }
  ensureShareholderRole(database);
  ensureBossRole(database);
  ensureStoreMemberCanRecord(database);
}

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
    {
      id: '4',
      name: '股东',
      permissions: JSON.stringify(['查看报表']),
    },
    {
      id: '5',
      name: '老板',
      permissions: JSON.stringify(['查看报表', '录入收支', '事务审批', '门店团队管理']),
    },
  ];

  /** 迁移里可能已插入「股东」「老板」等；users 仍为空时不应因重复角色名崩溃 */
  const insertRole = database.prepare(
    'INSERT OR IGNORE INTO roles (id, name, permissions) VALUES (@id, @name, @permissions)',
  );
  for (const r of roles) insertRole.run(r);

  const adminId = randomUUID();
  database
    .prepare(
      `INSERT INTO users (id, username, email, password_hash, name, role_id, status, avatar_url, created_at)
       VALUES (@id, @username, @email, @password_hash, @name, @role_id, @status, @avatar_url, @created_at)`,
    )
    .run({
      id: adminId,
      username: 'admin',
      email: 'owner@example.com',
      password_hash: bcrypt.hashSync('123456', 10),
      name: '李老板',
      role_id: '1',
      status: 'active',
      avatar_url: 'https://picsum.photos/seed/owner/100/100',
      created_at: now,
    });

  const managerId = randomUUID();
  const cashierId = randomUUID();
  const shareholderId = randomUUID();
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
      status: 'active',
      avatar_url: 'https://picsum.photos/seed/cashier/100/100',
      created_at: now,
    });
  database
    .prepare(
      `INSERT INTO users (id, username, email, password_hash, name, role_id, status, avatar_url, created_at)
       VALUES (@id, @username, @email, @password_hash, @name, @role_id, @status, @avatar_url, @created_at)`,
    )
    .run({
      id: shareholderId,
      username: 'shareholder',
      email: 'shareholder@example.com',
      password_hash: bcrypt.hashSync('123456', 10),
      name: '赵股东',
      role_id: '4',
      status: 'active',
      avatar_url: 'https://picsum.photos/seed/sh/100/100',
      created_at: now,
    });

  const storeA = randomUUID();
  const storeB = randomUUID();
  database.prepare(`INSERT INTO stores (id, name, created_at) VALUES (?, ?, ?)`).run(storeA, '一号店', now);
  database
    .prepare(`INSERT INTO stores (id, name, created_at) VALUES (?, ?, ?)`)
    .run(storeB, '二号店（张店长）', now);

  const insM = database.prepare(
    `INSERT INTO store_members (user_id, store_id, role_id, can_view_overview, can_view_transaction_lines, can_record, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );
  insM.run(adminId, storeA, '5', 1, 1, 1, now);
  insM.run(managerId, storeA, '2', 1, 1, 1, now);
  insM.run(cashierId, storeA, '3', 1, 1, 1, now);
  insM.run(shareholderId, storeA, '4', 1, 1, 0, now);
  insM.run(managerId, storeB, '5', 1, 1, 1, now);

  const txInsert = database.prepare(
    `INSERT INTO transactions (id, store_id, user_id, kind, title, subtitle, amount, occurred_at, created_at)
     VALUES (@id, @store_id, @user_id, @kind, @title, @subtitle, @amount, @occurred_at, @created_at)`,
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
      store_id: storeA,
      user_id: adminId,
      created_at: now,
    });
  }

  database.prepare(
    `INSERT INTO transactions (id, store_id, user_id, kind, title, subtitle, amount, occurred_at, created_at)
     VALUES (?, ?, ?, 'income', '店员录入', '收银员', 88, ?, ?)`,
  ).run(randomUUID(), storeA, cashierId, '2026-04-04T08:00:00.000Z', now);

  const mgInsert = database.prepare(
    `INSERT INTO management_items (id, store_id, user_id, title, status, type, occurred_at, created_at, note)
     VALUES (@id, @store_id, @user_id, @title, @status, @type, @occurred_at, @created_at, @note)`,
  );
  const items = [
    {
      id: randomUUID(),
      title: '库存预警：原材料不足',
      status: '待审批',
      type: 'notification' as const,
      occurred_at: '2026-04-04T10:00:00.000Z',
      note: '面粉库存低于安全线，请尽快补货。',
    },
    {
      id: randomUUID(),
      title: '采购申请：办公用品',
      status: '待审批',
      type: 'approval' as const,
      occurred_at: '2026-04-04T09:00:00.000Z',
      note: 'A4 纸、签字笔一批，预算约 300 元。',
    },
    {
      id: randomUUID(),
      title: '维修申请：空调故障',
      status: '已通过',
      type: 'approval' as const,
      occurred_at: '2026-04-02T11:00:00.000Z',
      note: '大厅空调不制冷，已联系维保。',
    },
  ];
  for (const m of items) {
    mgInsert.run({ ...m, store_id: storeA, user_id: adminId, created_at: now });
  }
}

export function getDb(databasePath: string): Database.Database {
  if (db) return db;

  const dir = path.dirname(path.resolve(databasePath));
  fs.mkdirSync(dir, { recursive: true });

  db = new Database(databasePath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  runMigrations(db);
  seedIfEmpty(db);
  return db;
}
