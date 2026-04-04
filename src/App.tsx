import React, { useState } from 'react';
import { TrendingUp, ShoppingCart } from 'lucide-react';
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
import { MOCK_INCOME, MOCK_EXPENSE, MOCK_MANAGEMENT, MOCK_USERS, MOCK_ROLES } from './mockData';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [view, setView] = useState<View>('home');
  const [activeCard, setActiveCard] = useState<'assets' | 'repayment'>('assets');
  
  // Monthly Flow Filters
  const [selectedMonth, setSelectedMonth] = useState('2026.04');
  const [selectedAccount, setSelectedAccount] = useState('小店账户');
  const [selectedSort, setSelectedSort] = useState('按金额');
  const [openDropdown, setOpenDropdown] = useState<'month' | 'account' | 'sort' | null>(null);

  // Data Lists State
  const [incomeList, setIncomeList] = useState<Transaction[]>(MOCK_INCOME);
  const [expenseList, setExpenseList] = useState<Transaction[]>(MOCK_EXPENSE);
  const [managementList, setManagementList] = useState<ManagementItem[]>(MOCK_MANAGEMENT);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [roles, setRoles] = useState<Role[]>(MOCK_ROLES);

  // Add Record Modal State
  const [showAddModal, setShowAddModal] = useState<View | null>(null);
  const [newRecord, setNewRecord] = useState({ title: '', amount: '', subtitle: '', date: new Date().toISOString().split('T')[0] });

  const handleLogin = () => {
    setIsAuthenticated(true);
    setView('home');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setView('login');
  };

  const handleAddRecord = () => {
    if (!newRecord.title) return;

    if (showAddModal === 'income') {
      const item: Transaction = {
        id: Date.now().toString(),
        title: newRecord.title,
        subtitle: newRecord.subtitle || '新增收入',
        amount: parseFloat(newRecord.amount) || 0,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: newRecord.date,
        icon: <TrendingUp size={20} />,
        isPositive: true,
        color: 'bg-cyan-custom/20'
      };
      setIncomeList([item, ...incomeList]);
    } else if (showAddModal === 'expense') {
      const item: Transaction = {
        id: Date.now().toString(),
        title: newRecord.title,
        subtitle: newRecord.subtitle || '新增支出',
        amount: -(parseFloat(newRecord.amount) || 0),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: newRecord.date,
        icon: <ShoppingCart size={20} />,
        isPositive: false,
        color: 'bg-orange-custom/20'
      };
      setExpenseList([item, ...expenseList]);
    } else if (showAddModal === 'management') {
      const item: ManagementItem = {
        id: Date.now().toString(),
        title: newRecord.title,
        status: '待处理',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: newRecord.date,
        type: 'notification'
      };
      setManagementList([item, ...managementList]);
    }

    setShowAddModal(null);
    setNewRecord({ title: '', amount: '', subtitle: '', date: new Date().toISOString().split('T')[0] });
  };

  const renderContent = () => {
    if (!isAuthenticated) {
      return <Login onLogin={handleLogin} />;
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
        return <Login onLogin={handleLogin} />;
      default:
        return <div className="flex items-center justify-center min-h-screen text-gray-400 font-black uppercase tracking-widest">敬请期待</div>;
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#F8FAFC] font-sans text-[#1E293B] selection:bg-primary/30">
      <AnimatePresence mode="wait">
        {renderContent()}
      </AnimatePresence>

      {isAuthenticated && (
        <>
          <AddRecordModal 
            showAddModal={showAddModal}
            setShowAddModal={setShowAddModal}
            newRecord={newRecord}
            setNewRecord={setNewRecord}
            handleAddRecord={handleAddRecord}
          />
          
          <BottomNav view={view} setView={setView} />
        </>
      )}
    </div>
  );
}
