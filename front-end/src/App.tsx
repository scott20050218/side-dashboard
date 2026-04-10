import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence } from 'motion/react';
import { View, Transaction, type Role } from './types';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { IncomeDetail } from './pages/IncomeDetail';
import { ExpenseDetail } from './pages/ExpenseDetail';
import { Management } from './pages/Management';
import { AccountDetail } from './pages/AccountDetail';
import { MonthlyFlow } from './pages/MonthlyFlow';
import { Report } from './pages/Report';
import { UserManagement } from './pages/UserManagement';
import { AuthManagement } from './pages/AuthManagement';
import { AdminStores } from './pages/AdminStores';
import { StoreTeam } from './pages/StoreTeam';
import { Profile } from './pages/Profile';
import { Amendments } from './pages/Amendments';
import { AddRecordModal } from './components/AddRecordModal';
import { BottomNav } from './components/BottomNav';
import {
  hasStoredToken,
  logout as apiLogout,
  fetchTransactions,
  fetchManagementItems,
  fetchUsers,
  fetchRoles,
  createTransaction,
  createManagementItem,
  reviewManagementItem,
  fetchOverview,
  fetchAdminStores,
  ApiError,
  setSelectedStoreId,
  getSelectedStoreId,
  resolveStoreIdFromUser,
  requestTransactionAmendment,
  fetchAmendments,
  reviewAmendment,
  fetchMyStores,
  onAuthExpired,
  type LoginUser,
  type ApiAmendment,
  isUserBossOfStore,
  isBossRoleName,
  userHasStoreTeamPermission,
  normId,
} from './lib/api';
import {
  mapApiTransaction,
  mapApiManagementItem,
  mapApiUser,
  mapApiRole,
} from './lib/mapApiToView';

function readSessionUser(): LoginUser | null {
  try {
    const s = sessionStorage.getItem('dashboard_user');
    if (!s) return null;
    return JSON.parse(s) as LoginUser;
  } catch {
    return null;
  }
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<LoginUser | null>(null);
  const [view, setView] = useState<View>('home');
  const [activeCard, setActiveCard] = useState<'assets' | 'repayment'>('assets');
  const [actionError, setActionError] = useState('');

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [monthlyFlowOpenDropdown, setMonthlyFlowOpenDropdown] = useState<'month' | null>(null);

  const [incomeList, setIncomeList] = useState<Transaction[]>([]);
  const [expenseList, setExpenseList] = useState<Transaction[]>([]);
  const [managementList, setManagementList] = useState<import('./types').ManagementItem[]>([]);
  const [users, setUsers] = useState<import('./types').User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [adminStores, setAdminStores] = useState<Array<{ id: string; name: string }>>([]);
  const handleRolesFetched = useCallback((r: Role[]) => {
    setRoles(r);
  }, []);
  const [overview, setOverview] = useState<{
    incomeTotal: number;
    expenseTotal: number;
    month: string;
    net: number;
  } | null>(null);

  const [storeAmendments, setStoreAmendments] = useState<ApiAmendment[]>([]);
  const [storeAmendmentsError, setStoreAmendmentsError] = useState('');
  const [storeAmendmentsLoading, setStoreAmendmentsLoading] = useState(false);

  const [showAddModal, setShowAddModal] = useState<View | null>(null);
  const [newRecord, setNewRecord] = useState({
    title: '',
    amount: '',
    subtitle: '',
    date: new Date().toISOString().split('T')[0],
  });

  const [amendTarget, setAmendTarget] = useState<Transaction | null>(null);
  const [amendForm, setAmendForm] = useState({
    title: '',
    subtitle: '',
    amount: '',
    date: '',
    kind: 'income' as 'income' | 'expense',
    reason: '',
  });
  const [amendModalError, setAmendModalError] = useState('');

  const [activeStoreId, setActiveStoreId] = useState(() => getSelectedStoreId() ?? '');

  /** 当前门店成员行；单店时即使 activeStoreId 尚未写入也回退到唯一门店，避免「我的团队」不显示 */
  const membership = useMemo(() => {
    const stores = currentUser?.stores ?? [];
    if (!stores.length) return undefined;
    const aid = activeStoreId.trim();
    if (aid) {
      const hit = stores.find((s) => s.id === aid);
      if (hit) return hit;
    }
    if (stores.length === 1) return stores[0];
    return undefined;
  }, [currentUser, activeStoreId]);

  /** 本店成员角色为「老板」，或服务端 canManageStoreTeam */
  const isStoreBossForActiveStore = useMemo(
    () => isUserBossOfStore(currentUser, membership),
    [currentUser, membership],
  );

  /** 与登录接口一致；旧版 session 里可能只有 role 字符串没有 isSuperAdmin。 */
  const superAdmin = useMemo(
    () => Boolean(currentUser?.isSuperAdmin || currentUser?.role === '超级管理员'),
    [currentUser?.isSuperAdmin, currentUser?.role],
  );

  const showAmendmentsNav = Boolean(isStoreBossForActiveStore || superAdmin);
  /** 门店老板全权限；店长/收银员/股东是否可录入由老板在成员上授权 canRecord */
  const allowRecord = Boolean(
    superAdmin || isStoreBossForActiveStore || membership?.canRecord === true,
  );
  /** 与后端 GET /transactions 一致：老板/店长全店；收银员仅本人列表但需拉取；股东按权限 */
  const storeRole = membership ? normId(membership.storeRole) : '';
  const canViewLines = Boolean(
    membership &&
      (superAdmin ||
        isStoreBossForActiveStore ||
        storeRole === '店长' ||
        membership.canViewTransactionLines === true ||
        (storeRole === '收银员' &&
          (membership.canRecord === true || membership.canViewTransactionLines === true)) ||
        (storeRole === '股东' &&
          (membership.canViewTransactionLines === true || membership.canRecord === true))),
  );
  /** 当前门店成员角色为收银员时，首页不展示经营概况/本月收支，仅保留收入与支出入口 */
  const isCashierAtActiveStore = Boolean(
    membership && normId(membership.storeRole) === '收银员',
  );
  const showHomeSummaryCards = !isCashierAtActiveStore;
  const showIncomeExpenseHome = Boolean(superAdmin || isCashierAtActiveStore || canViewLines);
  const showManagementHome = Boolean(
    membership &&
      normId(membership.storeRole) !== '股东' &&
      !superAdmin &&
      (isStoreBossForActiveStore ||
        membership.canViewOverview === true ||
        membership.canRecord === true),
  );
  const showManagementHomeAdmin = superAdmin;
  const requestAmendAllowed = Boolean(
    superAdmin || isStoreBossForActiveStore || membership?.canRecord === true,
  );

  const staffRoles = useMemo(
    () => roles.filter((r) => ['店长', '收银员', '股东'].includes(r.name)),
    [roles],
  );
  const showStoreTeam = isStoreBossForActiveStore;

  const redirectToLogin = useCallback(() => {
    apiLogout();
    setActiveStoreId('');
    sessionStorage.removeItem('dashboard_user');
    setCurrentUser(null);
    setIsAuthenticated(false);
    setView('login');
  }, []);

  useEffect(() => {
    return onAuthExpired(() => {
      redirectToLogin();
    });
  }, [redirectToLogin]);

  const loadDashboard = useCallback(async () => {
    if (superAdmin) {
      const [ur, rr, ar] = await Promise.allSettled([
        fetchUsers(),
        fetchRoles(),
        fetchAdminStores(),
      ]);
      if (ur.status === 'fulfilled') {
        setUsers(ur.value.map(mapApiUser));
      } else {
        setUsers([]);
        const e = ur.reason;
        if (e instanceof ApiError && e.status === 401) {
          redirectToLogin();
          return;
        }
      }
      if (rr.status === 'fulfilled') {
        setRoles(rr.value.map(mapApiRole));
      } else {
        setRoles([]);
        const e = rr.reason;
        if (e instanceof ApiError && e.status === 401) {
          redirectToLogin();
          return;
        }
      }
      if (ar.status === 'fulfilled') {
        setAdminStores(ar.value.map((s) => ({ id: s.id, name: s.name })));
      } else {
        setAdminStores([]);
        const e = ar.reason;
        if (e instanceof ApiError && e.status === 401) {
          redirectToLogin();
          return;
        }
      }
      const errs: string[] = [];
      if (ur.status === 'rejected') {
        errs.push(ur.reason instanceof Error ? ur.reason.message : '用户列表加载失败');
      }
      if (rr.status === 'rejected') {
        errs.push(rr.reason instanceof Error ? rr.reason.message : '角色列表加载失败');
      }
      if (ar.status === 'rejected') {
        errs.push(ar.reason instanceof Error ? ar.reason.message : '门店列表加载失败');
      }
      if (errs.length > 0) {
        redirectToLogin();
        return;
      }
    } else {
      setUsers([]);
      setAdminStores([]);
      const needsStaffRoles =
        isBossRoleName(currentUser?.role) ||
        userHasStoreTeamPermission(currentUser) ||
        (currentUser?.stores ?? []).some((s) => isUserBossOfStore(currentUser, s));
      if (needsStaffRoles) {
        try {
          const r = await fetchRoles();
          setRoles(r.map(mapApiRole));
        } catch {
          setRoles([]);
          redirectToLogin();
          return;
        }
      } else {
        setRoles([]);
      }
    }

    let sid = resolveStoreIdFromUser(currentUser);
    if (!sid && activeStoreId.trim()) {
      sid = activeStoreId.trim();
      setSelectedStoreId(sid);
    }
    if (!sid) {
      if (!superAdmin) {
        redirectToLogin();
      }
      return;
    }
    const m = currentUser?.stores?.find((s) => s.id === sid);
    const canFetchOverview =
      superAdmin ||
      Boolean(
        m && (isUserBossOfStore(currentUser, m) || m.canViewOverview === true),
      );
    try {
      if (canFetchOverview) {
        const ov = await fetchOverview(sid);
        setOverview({
          incomeTotal: ov.incomeTotal,
          expenseTotal: ov.expenseTotal,
          month: ov.month,
          net: ov.net,
          storeName: ov.store?.name,
        });
      } else {
        setOverview(null);
      }
      const storeRoleM = m ? normId(m.storeRole) : '';
      const canLines =
        m &&
        (superAdmin ||
          isUserBossOfStore(currentUser, m) ||
          storeRoleM === '店长' ||
          m.canViewTransactionLines === true ||
          (storeRoleM === '收银员' &&
            (m.canRecord === true || m.canViewTransactionLines === true)) ||
          (storeRoleM === '股东' &&
            (m.canViewTransactionLines === true || m.canRecord === true)));
      if (canLines) {
        const [inc, exp] = await Promise.all([
          fetchTransactions('income', sid),
          fetchTransactions('expense', sid),
        ]);
        setIncomeList(inc.map(mapApiTransaction));
        setExpenseList(exp.map(mapApiTransaction));
      } else {
        setIncomeList([]);
        setExpenseList([]);
      }
      const tasks: Promise<unknown>[] = [];
      if (showManagementHome || showManagementHomeAdmin) {
        tasks.push(
          fetchManagementItems(sid).then((mg) => setManagementList(mg.map(mapApiManagementItem))),
        );
      } else {
        setManagementList([]);
      }
      await Promise.all(tasks);
    } catch {
      redirectToLogin();
    }
  }, [
    activeStoreId,
    currentUser,
    superAdmin,
    showManagementHome,
    showManagementHomeAdmin,
    redirectToLogin,
  ]);

  const loadStoreAmendments = useCallback(async () => {
    if (!showAmendmentsNav || !activeStoreId.trim()) return;
    setStoreAmendmentsLoading(true);
    setStoreAmendmentsError('');
    try {
      const rows = await fetchAmendments(undefined, activeStoreId);
      setStoreAmendments(rows);
    } catch (e) {
      setStoreAmendments([]);
      if (!(e instanceof ApiError && e.status === 403)) {
        setStoreAmendmentsError(e instanceof ApiError ? e.message : '加载审批列表失败');
      }
    } finally {
      setStoreAmendmentsLoading(false);
    }
  }, [showAmendmentsNav, activeStoreId]);

  const handleAmendmentApprove = useCallback(
    async (id: string) => {
      await reviewAmendment(id, { action: 'approve' }, activeStoreId);
      await loadDashboard();
      await loadStoreAmendments();
    },
    [activeStoreId, loadDashboard, loadStoreAmendments],
  );

  const handleAmendmentReject = useCallback(
    async (id: string, rejectReason: string) => {
      await reviewAmendment(id, { action: 'reject', rejectReason }, activeStoreId);
      await loadDashboard();
      await loadStoreAmendments();
    },
    [activeStoreId, loadDashboard, loadStoreAmendments],
  );

  const handleManagementItemApprove = useCallback(
    async (id: string) => {
      await reviewManagementItem(id, { action: 'approve' }, activeStoreId);
      await loadDashboard();
    },
    [activeStoreId, loadDashboard],
  );

  const handleManagementItemReject = useCallback(
    async (id: string, rejectReason: string) => {
      await reviewManagementItem(id, { action: 'reject', rejectReason }, activeStoreId);
      await loadDashboard();
    },
    [activeStoreId, loadDashboard],
  );

  useEffect(() => {
    if (view !== 'management' || !showAmendmentsNav || !activeStoreId.trim()) return;
    void loadStoreAmendments();
  }, [view, showAmendmentsNav, activeStoreId, loadStoreAmendments]);

  useEffect(() => {
    const sessionUser = readSessionUser();
    if (hasStoredToken() && sessionUser) {
      setIsAuthenticated(true);
      setCurrentUser(sessionUser);
      return;
    }
    if (hasStoredToken() && !sessionUser) {
      redirectToLogin();
    }
  }, [redirectToLogin]);

  useEffect(() => {
    if (!isAuthenticated || !currentUser) return;
    const sid = resolveStoreIdFromUser(currentUser);
    if (sid) setActiveStoreId(sid);
  }, [isAuthenticated, currentUser]);

  /** 用接口刷新门店列表，补全 canManageStoreTeam 等字段 */
  useEffect(() => {
    if (!isAuthenticated || !currentUser) return;
    if (currentUser.isSuperAdmin || currentUser.role === '超级管理员') return;
    let cancelled = false;
    void (async () => {
      try {
        const fresh = await fetchMyStores();
        if (cancelled) return;
        setCurrentUser((prev) => {
          if (!prev) return prev;
          if (JSON.stringify(prev.stores ?? []) === JSON.stringify(fresh)) return prev;
          const merged = { ...prev, stores: fresh };
          try {
            sessionStorage.setItem('dashboard_user', JSON.stringify(merged));
          } catch {
            /* ignore */
          }
          return merged;
        });
      } catch {
        /* 离线或 401 等：保留登录/会话里的 stores */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, currentUser?.id]);

  useEffect(() => {
    if (!isAuthenticated) return;
    void loadDashboard();
  }, [isAuthenticated, loadDashboard, activeStoreId]);

  const handleLoginSuccess = (user: LoginUser) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    const sid = resolveStoreIdFromUser(user) ?? '';
    setActiveStoreId(sid);
    setView('home');
  };

  const handleLogout = () => {
    redirectToLogin();
  };

  const handleStoreChange = (id: string) => {
    setSelectedStoreId(id);
    setActiveStoreId(id);
  };

  const handleAddRecord = async () => {
    if (!newRecord.title) return;

    setActionError('');
    try {
      if (showAddModal === 'income') {
        await createTransaction(
          {
            kind: 'income',
            title: newRecord.title,
            subtitle: newRecord.subtitle || '新增收入',
            amount: parseFloat(newRecord.amount) || 0,
            date: newRecord.date,
          },
          activeStoreId,
        );
      } else if (showAddModal === 'expense') {
        await createTransaction(
          {
            kind: 'expense',
            title: newRecord.title,
            subtitle: newRecord.subtitle || '新增支出',
            amount: parseFloat(newRecord.amount) || 0,
            date: newRecord.date,
          },
          activeStoreId,
        );
      } else if (showAddModal === 'management') {
        await createManagementItem(
          {
            title: newRecord.title,
            date: newRecord.date,
            type: 'notification',
            note: newRecord.subtitle.trim() || undefined,
          },
          activeStoreId,
        );
      }
      await loadDashboard();
    } catch {
      redirectToLogin();
      return;
    }

    setShowAddModal(null);
    setNewRecord({
      title: '',
      amount: '',
      subtitle: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  const openAmend = (item: Transaction) => {
    setAmendModalError('');
    setAmendTarget(item);
    setAmendForm({
      title: item.title,
      subtitle: item.subtitle,
      amount: String(Math.abs(item.amount)),
      date: item.date,
      kind: item.kind ?? (item.isPositive ? 'income' : 'expense'),
      reason: '',
    });
  };

  const submitAmend = async () => {
    if (!amendTarget) return;
    setAmendModalError('');
    const reason = amendForm.reason.trim();
    if (!reason) {
      setAmendModalError('请填写申请原因');
      return;
    }
    try {
      await requestTransactionAmendment(
        amendTarget.id,
        {
          kind: amendForm.kind,
          title: amendForm.title,
          subtitle: amendForm.subtitle,
          amount: parseFloat(amendForm.amount) || 0,
          date: amendForm.date,
          reason,
        },
        activeStoreId,
      );
      setAmendTarget(null);
      await loadDashboard();
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        redirectToLogin();
        return;
      }
      setAmendModalError(e instanceof ApiError ? e.message : '提交失败');
    }
  };

  const homeStores = (currentUser?.stores ?? []).map((s) => ({ id: s.id, name: s.name }));

  const renderContent = () => {
    if (!isAuthenticated) {
      return <Login onLogin={handleLoginSuccess} />;
    }

    switch (view) {
      case 'home':
        return (
          <Home
            setView={setView}
            onLogout={handleLogout}
            stores={homeStores}
            selectedStoreId={activeStoreId}
            onStoreChange={handleStoreChange}
            overview={overview}
            showSummaryCards={showHomeSummaryCards}
            showIncomeExpense={showIncomeExpenseHome}
            showManagement={showManagementHome || showManagementHomeAdmin}
          />
        );
      case 'income':
        return (
          <IncomeDetail
            setView={setView}
            incomeList={incomeList}
            setShowAddModal={setShowAddModal}
            canCreate={allowRecord}
            onRequestAmend={requestAmendAllowed ? openAmend : undefined}
          />
        );
      case 'expense':
        return (
          <ExpenseDetail
            setView={setView}
            expenseList={expenseList}
            setShowAddModal={setShowAddModal}
            canCreate={allowRecord}
            onRequestAmend={requestAmendAllowed ? openAmend : undefined}
          />
        );
      case 'management':
        return (
          <Management
            setView={setView}
            managementList={managementList}
            setShowAddModal={setShowAddModal}
            amendmentAudit={
              showAmendmentsNav && activeStoreId.trim()
                ? {
                    items: storeAmendments,
                    loading: storeAmendmentsLoading,
                    error: storeAmendmentsError,
                    onApprove: handleAmendmentApprove,
                    onReject: handleAmendmentReject,
                  }
                : undefined
            }
            managementItemReview={
              showAmendmentsNav && activeStoreId.trim()
                ? {
                    onApprove: handleManagementItemApprove,
                    onReject: handleManagementItemReject,
                  }
                : undefined
            }
          />
        );
      case 'account_detail':
        return (
          <AccountDetail
            setView={setView}
            activeCard={activeCard}
            setActiveCard={setActiveCard}
            overview={
              overview
                ? {
                    incomeTotal: overview.incomeTotal,
                    expenseTotal: overview.expenseTotal,
                    month: overview.month,
                    net: overview.net,
                  }
                : null
            }
            incomeList={incomeList}
            expenseList={expenseList}
          />
        );
      case 'monthly_flow':
        return (
          <MonthlyFlow
            setView={setView}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            openDropdown={monthlyFlowOpenDropdown}
            setOpenDropdown={setMonthlyFlowOpenDropdown}
            incomeList={incomeList}
            expenseList={expenseList}
            storeName={overview?.storeName}
          />
        );
      case 'report':
        return (
          <Report
            setView={setView}
            overview={
              overview
                ? {
                    incomeTotal: overview.incomeTotal,
                    expenseTotal: overview.expenseTotal,
                    month: overview.month,
                    net: overview.net,
                  }
                : null
            }
            incomeList={incomeList}
            storeId={activeStoreId}
          />
        );
      case 'user_management':
        return (
          <UserManagement
            setView={setView}
            users={users}
            roles={roles}
            adminStores={adminStores}
            creatorIsSuperAdmin={superAdmin}
            listLoadError=""
            currentUserId={currentUser?.id}
            onRefresh={() => void loadDashboard()}
            onRolesFetched={handleRolesFetched}
            onRequireLogin={redirectToLogin}
          />
        );
      case 'auth_management':
        return <AuthManagement setView={setView} roles={roles} />;
      case 'admin_stores':
        return (
          <AdminStores
            setView={setView}
            users={users}
            onRefreshLists={() => void loadDashboard()}
          />
        );
      case 'store_team':
        return (
          <StoreTeam
            setView={setView}
            storeId={activeStoreId}
            storeName={currentUser?.stores?.find((s) => s.id === activeStoreId)?.name}
            staffRoles={staffRoles}
            onRefreshSession={() => void loadDashboard()}
          />
        );
      case 'profile':
        return (
          <Profile
            setView={setView}
            onLogout={handleLogout}
            userName={currentUser?.name}
            roleLabel={currentUser?.role}
            storeCount={homeStores.length}
            showAdminLinks={superAdmin}
            showStoreTeam={showStoreTeam}
          />
        );
      case 'amendments':
        return <Amendments setView={setView} storeId={activeStoreId} />;
      case 'login':
        return <Login onLogin={handleLoginSuccess} />;
      default:
        return (
          <div className="flex items-center justify-center min-h-screen text-gray-400 font-black uppercase tracking-widest">
            敬请期待
          </div>
        );
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#F8FAFC] font-sans text-[#1E293B] selection:bg-primary/30">
      {isAuthenticated && actionError ? (
        <div className="fixed top-0 left-0 right-0 z-[200] mx-auto max-w-md px-4 pt-4">
          <div className="flex items-center justify-between gap-2 rounded-2xl bg-red-500 text-white text-xs font-bold px-4 py-3 shadow-lg">
            <span>{actionError}</span>
            <button type="button" onClick={() => setActionError('')} className="shrink-0 opacity-80">
              关闭
            </button>
          </div>
        </div>
      ) : null}
      <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>

      {amendTarget ? (
        <div className="fixed inset-0 z-[300] flex items-end justify-center bg-black/40 px-4 pb-10 max-w-md mx-auto">
          <div className="w-full bg-white rounded-[28px] p-6 shadow-2xl space-y-3">
            <h3 className="text-lg font-black">申请修改流水</h3>
            {amendModalError ? (
              <p className="text-xs text-red-500 font-bold">{amendModalError}</p>
            ) : null}
            <label className="block text-[10px] font-black text-gray-400 uppercase">类型</label>
            <select
              value={amendForm.kind}
              onChange={(e) => setAmendForm((f) => ({ ...f, kind: e.target.value as 'income' | 'expense' }))}
              className="w-full rounded-xl border border-gray-100 py-2 px-3 text-sm font-bold"
            >
              <option value="income">收入</option>
              <option value="expense">支出</option>
            </select>
            <label className="block text-[10px] font-black text-gray-400 uppercase">标题</label>
            <input
              value={amendForm.title}
              onChange={(e) => setAmendForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full rounded-xl border border-gray-100 py-2 px-3 text-sm font-bold"
            />
            <label className="block text-[10px] font-black text-gray-400 uppercase">副标题</label>
            <input
              value={amendForm.subtitle}
              onChange={(e) => setAmendForm((f) => ({ ...f, subtitle: e.target.value }))}
              className="w-full rounded-xl border border-gray-100 py-2 px-3 text-sm font-bold"
            />
            <label className="block text-[10px] font-black text-gray-400 uppercase">金额（正数）</label>
            <input
              type="number"
              value={amendForm.amount}
              onChange={(e) => setAmendForm((f) => ({ ...f, amount: e.target.value }))}
              className="w-full rounded-xl border border-gray-100 py-2 px-3 text-sm font-bold"
            />
            <label className="block text-[10px] font-black text-gray-400 uppercase">日期</label>
            <input
              type="date"
              value={amendForm.date}
              onChange={(e) => setAmendForm((f) => ({ ...f, date: e.target.value }))}
              className="w-full rounded-xl border border-gray-100 py-2 px-3 text-sm font-bold"
            />
            <label className="block text-[10px] font-black text-gray-400 uppercase">
              申请原因 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={amendForm.reason}
              onChange={(e) => {
                setAmendModalError('');
                setAmendForm((f) => ({ ...f, reason: e.target.value }));
              }}
              placeholder="请说明为何需要修改此流水（必填）"
              rows={3}
              className="w-full rounded-xl border border-gray-100 py-2 px-3 text-sm font-bold resize-none"
            />
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setAmendTarget(null);
                  setAmendModalError('');
                }}
                className="flex-1 py-3 rounded-xl bg-gray-100 font-black text-sm"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => void submitAmend()}
                className="flex-1 py-3 rounded-xl bg-primary text-white font-black text-sm"
              >
                提交审批
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isAuthenticated && (
        <>
          <AddRecordModal
            showAddModal={showAddModal}
            setShowAddModal={setShowAddModal}
            newRecord={newRecord}
            setNewRecord={setNewRecord}
            handleAddRecord={() => void handleAddRecord()}
          />

          <BottomNav view={view} setView={setView} showAmendments={showAmendmentsNav} />
        </>
      )}
    </div>
  );
}
