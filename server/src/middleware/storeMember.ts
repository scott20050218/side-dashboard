import type { Response, NextFunction } from 'express';
import type Database from 'better-sqlite3';
import type { AuthedRequest } from './authJwt.js';
import {
  getStoreMembership,
  isStoreBossRoleName,
  isStoreLineScopedStaff,
  isStoreShareholderRoleName,
  isSuperAdmin,
} from '../lib/storeAuth.js';

export interface StoreAuthedRequest extends AuthedRequest {
  storeId?: string;
  /** 本店 roles.name：老板 | 店长 | 收银员 | 股东 */
  storeRole?: string;
  storeCtx?: {
    canViewOverview: boolean;
    canViewTransactionLines: boolean;
    canRecord: boolean;
    isOwner: boolean;
    isSuperAdmin: boolean;
  };
}

function parseStoreId(req: AuthedRequest): string | undefined {
  const q = req.query.storeId ?? req.query.store_id;
  if (typeof q === 'string' && q.trim()) return q.trim();
  const b = (req.body as { storeId?: string })?.storeId;
  if (typeof b === 'string' && b.trim()) return b.trim();
  const h = req.headers['x-store-id'];
  if (typeof h === 'string' && h.trim()) return h.trim();
  return undefined;
}

export function requireStoreMember(db: Database.Database) {
  return (req: StoreAuthedRequest, res: Response, next: NextFunction) => {
    if (req.method === 'OPTIONS') {
      next();
      return;
    }
    const storeId = parseStoreId(req);
    if (!storeId) {
      res.status(400).json({ error: 'storeId required (query, body, or X-Store-Id header)' });
      return;
    }
    const userId = req.userId!;
    const superA = isSuperAdmin(db, userId);
    const storeExists = db.prepare(`SELECT 1 FROM stores WHERE id = ?`).get(storeId);
    if (!storeExists) {
      res.status(404).json({ error: 'Store not found' });
      return;
    }

    const m = getStoreMembership(db, userId, storeId);
    if (!m && !superA) {
      res.status(403).json({ error: 'Forbidden for this store' });
      return;
    }

    const roleName = m?.role_name;
    const isOwner = superA || isStoreBossRoleName(roleName);
    const vOv = Boolean(m?.can_view_overview);
    const vLines = Boolean(m?.can_view_transaction_lines);
    const rec = Boolean(m?.can_record);

    const staffLike = isStoreLineScopedStaff(roleName);
    const shareholder = isStoreShareholderRoleName(roleName);

    const canViewOverview =
      superA || isOwner || (staffLike && vOv) || (shareholder && vOv);
    const canViewTransactionLines =
      superA || isOwner || (staffLike && vLines) || (shareholder && vLines);
    const canRecord = superA || isOwner || (staffLike && rec) || (shareholder && rec);

    req.storeId = storeId;
    if (roleName) req.storeRole = roleName;
    req.storeCtx = {
      canViewOverview,
      canViewTransactionLines,
      canRecord,
      isOwner,
      isSuperAdmin: superA,
    };
    next();
  };
}
