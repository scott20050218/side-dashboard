import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { getDb } from './db.js';
import { authJwt } from './middleware/authJwt.js';
import { requireStoreMember } from './middleware/storeMember.js';
import { createAuthRouter } from './routes/auth.js';
import { createTransactionsRouter } from './routes/transactions.js';
import { createManagementRouter } from './routes/management.js';
import { createSummaryRouter } from './routes/summary.js';
import { createUsersRouter } from './routes/users.js';
import { createRolesRouter } from './routes/roles.js';
import { createStoresRouter } from './routes/stores.js';
import { createAmendmentsRouter } from './routes/amendments.js';
import { createAdminStoresRouter } from './routes/adminStores.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const databasePath = process.env.DATABASE_PATH
  ? path.resolve(rootDir, process.env.DATABASE_PATH)
  : path.join(rootDir, 'data', 'app.db');

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  console.warn('JWT_SECRET is not set; using insecure dev default');
}

const secret = jwtSecret || 'dev-only-change-me';
const db = getDb(databasePath);

const app = express();
const corsOrigin = process.env.CORS_ORIGIN;
app.use(
  cors({
    origin: corsOrigin && corsOrigin !== '' ? corsOrigin.split(',').map((s) => s.trim()) : true,
    credentials: true,
  }),
);
app.use(express.json());

app.use('/api/auth', createAuthRouter(db, secret));

const protectedApi = express.Router();
protectedApi.use(authJwt(secret));

protectedApi.use('/stores', createStoresRouter(db));

const storeMember = requireStoreMember(db);
protectedApi.use('/transactions', storeMember, createTransactionsRouter(db));
protectedApi.use('/summary', storeMember, createSummaryRouter(db));
protectedApi.use('/amendments', storeMember, createAmendmentsRouter(db));
protectedApi.use('/management-items', storeMember, createManagementRouter(db));

protectedApi.use('/users', createUsersRouter(db));
protectedApi.use('/roles', createRolesRouter(db));
protectedApi.use('/admin', createAdminStoresRouter(db));

app.use('/api', protectedApi);

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`API listening on http://127.0.0.1:${port}`);
});
