import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'motion/react';
import { View, Transaction, ManagementItem, User, Role } from './types';
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
import { Profile } from './pages/Profile';
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
  ApiError,
} from './lib/api';
import {
  mapApiTransaction,
  mapApiManagementItem,
  mapApiUser,
  mapApiRole,
} from './lib/mapApiToView';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [view, setView] = useState<View>('home');
  const [activeCard, setActiveCard] = useState<'assets' | 'repayment'>('assets');
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');

  const [selectedMonth, setSelectedMonth] = useState('2026.04');
  const [selectedAccount, setSelectedAccount] = useState('小店账户');
  const [selectedSort, setSelectedSort] = useState('按金额');
  const [openDropdown, setOpenDropdown] = useState<'month' | 'account' | 'sort' | null>(null);

  const [incomeList, setIncomeList] = useState<Transaction[]>([]);
  const [expenseList, setExpenseList] = useState<Transaction[]>([]);
  const [managementList, setManagementList] = useState<ManagementItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  const [showAddModal, setShowAddModal] = useState<View | null>(null);
  const [newRecord, setNewRecord] = useState({
    title: '',
    amount: '',
    subtitle: '',
    date: new Date().toISOString().split('T')[0],
  });

  const loadDashboard = useCallback(async () => {
    setLoadError('');
    try {
      const [inc, exp, mg, u, r] = await Promise.all([
        fetchTransactions('income'),
        fetchTransactions('expense'),
        fetchManagementItems(),
        fetchUsers(),
        fetchRoles(),
      ]);
      setIncomeList(inc.map(mapApiTransaction));
      setExpenseList(exp.map(mapApiTransaction));
      setManagementList(mg.map(mapApiManagementItem));
      setUsers(u.map(mapApiUser));
      setRoles(r.map(mapApiRole));
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setIsAuthenticated(false);
        return;
      }
      setLoadError(e instanceof Error ? e.message : '加载失败');
    }
  }, []);

  useEffect(() => {
    if (hasStoredToken()) setIsAuthenticated(true);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    void loadDashboard();
  }, [isAuthenticated, loadDashboard]);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setView('home');
  };

  const handleLogout = () => {
    apiLogout();
    setIsAuthenticated(false);
    setView('login');
  };

  const handleAddRecord = async () => {
    if (!newRecord.title) return;

    setActionError('');
    try {
      if (showAddModal === 'income') {
        await createTransaction({
          kind: 'income',
          title: newRecord.title,
          subtitle: newRecord.subtitle || '新增收入',
          amount: parseFloat(newRecord.amount) || 0,
          date: newRecord.date,
        });
      } else if (showAddModal === 'expense') {
        await createTransaction({
          kind: 'expense',
          title: newRecord.title,
          subtitle: newRecord.subtitle || '新增支出',
          amount: parseFloat(newRecord.amount) || 0,
          date: newRecord.date,
        });
      } else if (showAddModal === 'management') {
        await createManagementItem({
          title: newRecord.title,
          date: newRecord.date,
          type: 'notification',
        });
      }
      await loadDashboard();
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : '保存失败');
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

  const renderContent = () => {
    if (!isAuthenticated) {
      return <Login onLogin={handleLoginSuccess} />;
    }

    if (loadError && incomeList.length === 0 && expenseList.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen px-6 gap-4">
          <p className="text-red-500 text-sm font-bold text-center">{loadError}</p>
          <button
            type="button"
            onClick={() => void loadDashboard()}
            className="px-6 py-3 rounded-2xl bg-primary text-white font-black"
          >
            重试
          </button>
        </div>
      );
    }

    switch (view) {
      case 'home':
        return <Home setView={setView} onLogout={handleLogout} />;
      case 'income':
        return <IncomeDetail setView={setView} incomeList={incomeList} setShowAddModal={setShowAddModal} />;
      case 'expense':
        return <ExpenseDetail setView={setView} expenseList={expenseList} setShowAddModal={setShowAddModal} />;
      case 'management':
        return <Management setView={setView} managementList={managementList} setShowAddModal={setShowAddModal} />;
      case 'account_detail':
        return <AccountDetail setView={setView} activeCard={activeCard} setActiveCard={setActiveCard} />;
      case 'monthly_flow':
        return (
          <MonthlyFlow
            setView={setView}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            selectedAccount={selectedAccount}
            setSelectedAccount={setSelectedAccount}
            selectedSort={selectedSort}
            setSelectedSort={setSelectedSort}
            openDropdown={openDropdown}
            setOpenDropdown={setOpenDropdown}
            incomeList={incomeList}
            expenseList={expenseList}
          />
        );
      case 'report':
        return <Report setView={setView} />;
      case 'user_management':
        return <UserManagement setView={setView} users={users} />;
      case 'auth_management':
        return <AuthManagement setView={setView} roles={roles} />;
      case 'profile':
        return <Profile setView={setView} onLogout={handleLogout} />;
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

      {isAuthenticated && (
        <>
          <AddRecordModal
            showAddModal={showAddModal}
            setShowAddModal={setShowAddModal}
            newRecord={newRecord}
            setNewRecord={setNewRecord}
            handleAddRecord={() => void handleAddRecord()}
          />

          <BottomNav view={view} setView={setView} />
        </>
      )}
    </div>
  );
}
