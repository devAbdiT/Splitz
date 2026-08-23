'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/src/components/AuthProvider';
import { auth } from '@/src/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { ThemeToggle } from '@/src/components/ThemeToggle';
import { cn, getAvatarColor } from '@/lib/utils';

interface TripData {
  id: number;
  name: string;
  description: string | null;
  baseCurrency: string;
}

interface Member {
  id: number;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  role: string;
  joinedAt: string;
}

interface Expense {
  id: number;
  description: string;
  category: string;
  date: string;
  createdAt: string;
  paidBy: {
    id: number;
    name: string;
    email: string;
  };
  amount: number;
  splitType: string;
}

export default function TripDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  
  const [trip, setTrip] = useState<TripData | null>(null);
  const [role, setRole] = useState<string>('');
  const [members, setMembers] = useState<Member[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Add Expense State
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [addExpenseLoading, setAddExpenseLoading] = useState(false);
  const [newExpenseDesc, setNewExpenseDesc] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [newExpenseDate, setNewExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [newExpenseCategory, setNewExpenseCategory] = useState('Food & Dining');
  const [newExpensePaidBy, setNewExpensePaidBy] = useState('');

  // Invite Modal State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteUrl, setInviteUrl] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  
  // Trip Settings State
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [editTripName, setEditTripName] = useState('');
  const [editTripDesc, setEditTripDesc] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  // Sorting state
  const [sortConfig, setSortConfig] = useState<{ key: 'date' | 'amount'; direction: 'asc' | 'desc' } | null>(null);

  const sortedExpenses = useMemo(() => {
    let sortableItems = [...expenses];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];
        
        if (sortConfig.key === 'date') {
          valA = new Date(a.date).getTime() as any;
          valB = new Date(b.date).getTime() as any;
        }
        
        if (valA < valB) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [expenses, sortConfig]);

  const requestSort = (key: 'date' | 'amount') => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const fetchTripData = async () => {
    try {
      const token = await user?.getIdToken();
      const [tripRes, membersRes, expensesRes] = await Promise.all([
        fetch(`/api/trips/${params.id}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/trips/${params.id}/members`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/trips/${params.id}/expenses`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (tripRes.ok && membersRes.ok) {
        const tripData = await tripRes.json();
        const membersData = await membersRes.json();
        setTrip(tripData.trip);
        setRole(tripData.role);
        setMembers(membersData.members);
        
        if (expensesRes.ok) {
          const expensesData = await expensesRes.json();
          setExpenses(expensesData.expenses);
        }
      } else {
        setError('Trip not found or unauthorized');
      }
    } catch (err) {
      setError('Failed to fetch trip details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && params.id) {
      fetchTripData();
    }
  }, [user, params.id]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpenseDesc || !newExpenseAmount || !newExpenseDate || !newExpensePaidBy) return;
    
    setAddExpenseLoading(true);
    try {
      const token = await user?.getIdToken();
      const res = await fetch(`/api/trips/${params.id}/expenses`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          description: newExpenseDesc,
          amount: newExpenseAmount,
          date: newExpenseDate,
          category: newExpenseCategory,
          paidById: newExpensePaidBy,
          splitType: 'equal' // default to equal for now
        })
      });
      if (res.ok) {
        setIsAddExpenseModalOpen(false);
        setNewExpenseDesc('');
        setNewExpenseAmount('');
        await fetchTripData(); // refresh data
      }
    } catch (err) {
      console.error('Failed to add expense:', err);
    } finally {
      setAddExpenseLoading(false);
    }
  };

  const handleGenerateInvite = async () => {
    setInviteLoading(true);
    setIsInviteModalOpen(true);
    try {
      const token = await user?.getIdToken();
      const res = await fetch(`/api/trips/${params.id}/invite`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setInviteUrl(data.inviteUrl);
        setQrCodeUrl(data.qrCodeUrl);
      }
    } catch (err) {
      console.error('Failed to generate invite');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleOpenSettings = () => {
    if (trip) {
      setEditTripName(trip.name);
      setEditTripDesc(trip.description || '');
      setIsSettingsModalOpen(true);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTripName.trim()) return;
    setIsSavingSettings(true);
    try {
      const token = await user?.getIdToken();
      const res = await fetch(`/api/trips/${params.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          name: editTripName,
          description: editTripDesc
        })
      });
      if (res.ok) {
        const data = await res.json();
        setTrip(data.trip);
        setIsSettingsModalOpen(false);
      }
    } catch (err) {
      console.error('Failed to update trip');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleArchiveTrip = async () => {
    if (!confirm('Are you sure you want to archive this trip?')) return;
    setIsArchiving(true);
    try {
      const token = await user?.getIdToken();
      const res = await fetch(`/api/trips/${params.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        router.push('/');
      }
    } catch (err) {
      console.error('Failed to archive trip');
      setIsArchiving(false);
    }
  };

  const handleSignOut = () => {
    signOut(auth);
  };

  if (!user) return null; // AuthProvider handles redirect
  
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 bg-emerald-600 rounded-sm flex items-center justify-center text-white font-bold text-xl animate-pulse">$</div>
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest animate-pulse">Loading Trip...</div>
        </div>
      </div>
    );
  }
  
  if (error || !trip) {
    return (
      <div className="flex flex-col h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-950 gap-4">
        <div className="text-red-500 text-4xl">⚠️</div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">{error || 'Trip not found'}</h2>
        <button 
          onClick={() => router.push('/')}
          className="mt-4 px-6 py-2 bg-slate-900 dark:bg-slate-800 text-white rounded text-xs font-bold uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Header Navigation */}
      <header className="flex items-center justify-between px-4 sm:px-8 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div 
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => router.push('/')}
        >
          <div className="w-8 h-8 bg-emerald-600 rounded-sm flex items-center justify-center text-white font-bold text-xl">$</div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 uppercase hidden sm:block">Lunch Money</h1>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-md">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:inline">Trip:</span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate max-w-[150px]">{trip.name}</span>
          </div>
          {role === 'admin' && (
            <>
              <button 
                onClick={handleGenerateInvite}
                className="hidden sm:block px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white rounded text-xs font-bold uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors"
              >
                Invite
              </button>
              <button
                onClick={handleOpenSettings}
                className="hidden sm:block p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                ⚙️
              </button>
            </>
          )}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className={cn(
              "w-9 h-9 rounded-full border border-white/20 dark:border-slate-800/50 flex items-center justify-center font-bold text-white uppercase shadow-sm",
              getAvatarColor(user.email || user.displayName || 'User')
            )}>
              {user.email?.charAt(0) || user.displayName?.charAt(0) || '?'}
            </div>
            <button 
              onClick={handleSignOut}
              className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest hover:text-slate-800 dark:hover:text-slate-200 hidden sm:block"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Layout */}
      <main className="flex-1 flex flex-col lg:flex-row gap-6 p-4 sm:p-6 max-w-7xl mx-auto w-full">
        {/* Left Column: Summary & Expenses */}
        <div className="flex-[1.4] flex flex-col gap-6">
          {/* Top Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm">
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Total Spent</p>
              <p className="text-3xl font-black text-slate-900 dark:text-slate-50">$4,821.50</p>
              <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-500 font-medium">+ $210.00 today</div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm">
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Your Balance</p>
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-500">+$142.20</p>
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-medium">Net: 3 owes, 2 owed</div>
            </div>
            <div className="bg-emerald-600 p-5 rounded-lg shadow-sm text-white">
              <p className="text-xs font-bold text-emerald-100 uppercase tracking-widest mb-1">Group Health</p>
              <p className="text-3xl font-black uppercase tracking-tighter italic">BALANCED</p>
              <div className="mt-2 text-xs text-emerald-100 font-medium">All receipts verified</div>
            </div>
          </div>

          {/* Recent Expenses Section */}
          <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden flex flex-col">
            <div className="px-4 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
              <h3 className="font-bold uppercase tracking-widest text-xs text-slate-500 dark:text-slate-400">Recent Expenses</h3>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsAddExpenseModalOpen(true)}
                  className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-bold uppercase tracking-tighter hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  + Add
                </button>
                <button className="text-emerald-600 dark:text-emerald-500 text-xs font-bold uppercase tracking-tighter hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors hidden sm:block">View All History</button>
              </div>
            </div>
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-sm text-left min-w-[500px]">
                <thead className="bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 uppercase text-[10px] font-bold select-none">
                  <tr>
                    <th 
                      className="px-4 sm:px-6 py-3 border-b dark:border-slate-800 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300 transition-colors group"
                      onClick={() => requestSort('date')}
                    >
                      <div className="flex items-center gap-1">
                        Description & Date
                        <span className={`text-xs ${sortConfig?.key === 'date' ? 'text-emerald-500 opacity-100' : 'opacity-0 group-hover:opacity-50'}`}>
                          {sortConfig?.key === 'date' && sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      </div>
                    </th>
                    <th className="px-4 sm:px-6 py-3 border-b dark:border-slate-800">Paid By</th>
                    <th 
                      className="px-4 sm:px-6 py-3 border-b dark:border-slate-800 text-right cursor-pointer hover:text-slate-600 dark:hover:text-slate-300 transition-colors group"
                      onClick={() => requestSort('amount')}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span className={`text-xs ${sortConfig?.key === 'amount' ? 'text-emerald-500 opacity-100' : 'opacity-0 group-hover:opacity-50'}`}>
                          {sortConfig?.key === 'amount' && sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                        Amount
                      </div>
                    </th>
                    <th className="px-4 sm:px-6 py-3 border-b dark:border-slate-800 text-center">Split</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {sortedExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400 italic text-sm">
                        No expenses yet. Add one to get started!
                      </td>
                    </tr>
                  ) : (
                    sortedExpenses.map((expense) => {
                      const isYou = expense.paidBy.email === user?.email;
                      const dateObj = new Date(expense.date);
                      const formattedDate = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                      return (
                        <tr 
                          key={expense.id} 
                          className={isYou 
                            ? "bg-emerald-50/50 dark:bg-emerald-900/10 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                          }
                        >
                          <td className="px-4 sm:px-6 py-4">
                            <div className={`font-bold ${isYou ? 'text-emerald-900 dark:text-emerald-100' : 'text-slate-800 dark:text-slate-200'}`}>
                              {expense.description}
                            </div>
                            <div className={`text-xs italic ${isYou ? 'text-emerald-600/70 dark:text-emerald-400/70' : 'text-slate-400 dark:text-slate-500'}`}>
                              {expense.category} • {formattedDate}
                            </div>
                          </td>
                          <td className={`px-4 sm:px-6 py-4 font-bold ${isYou ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-600 dark:text-slate-400 font-medium'}`}>
                            {isYou ? 'You' : (expense.paidBy.name || expense.paidBy.email.split('@')[0])}
                          </td>
                          <td className={`px-4 sm:px-6 py-4 text-right font-bold italic ${isYou ? 'text-emerald-900 dark:text-emerald-100' : 'text-slate-900 dark:text-slate-100'}`}>
                            ${typeof expense.amount === 'number' ? expense.amount.toFixed(2) : parseFloat(expense.amount).toFixed(2)}
                          </td>
                          <td className="px-4 sm:px-6 py-4 text-center">
                            <span className={isYou 
                              ? "bg-emerald-200/50 dark:bg-emerald-800/50 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase"
                            }>
                              {expense.splitType || 'EQUAL'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Settlement & Insights */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Settlement Plan */}
          <div className="bg-slate-900 text-white rounded-lg p-4 sm:p-6 shadow-xl flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">Optimization Engine</h3>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full opacity-30"></div>
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full opacity-30"></div>
              </div>
            </div>
            <h4 className="text-lg font-bold mb-4">Settlement Plan <span className="text-slate-500 font-normal text-sm">— 3 Steps</span></h4>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4 bg-slate-800/50 p-3 rounded border-l-2 border-emerald-500">
                <div className="flex-1">
                  <div className="text-[10px] text-slate-400 uppercase font-black">James L. owes You</div>
                  <div className="text-xl font-bold">$314.50</div>
                </div>
                <button className="px-3 py-1 bg-emerald-600 rounded text-xs font-bold">SETTLE</button>
              </div>
              <div className="flex items-center gap-4 bg-slate-800/50 p-3 rounded border-l-2 border-slate-500">
                <div className="flex-1">
                  <div className="text-[10px] text-slate-400 uppercase font-black">Alex M. owes Sarah K.</div>
                  <div className="text-xl font-bold">$142.10</div>
                </div>
                <button className="px-3 py-1 border border-slate-600 rounded text-xs font-bold">LOG</button>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-800">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Algorithm</p>
                  <p className="text-xs text-slate-300 font-mono">DFS-Recursive Min-Flow v2.1</p>
                </div>
                <div className="text-right text-[10px] text-emerald-400 underline font-bold uppercase cursor-pointer">Re-compute</div>
              </div>
            </div>
          </div>

          {/* Simple Category Viz */}
          <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 sm:p-6 flex flex-col">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-6">Spend Breakdown</h3>
            <div className="flex-1 flex flex-col justify-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-16 sm:w-24 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Lodging</div>
                <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-slate-800 dark:bg-slate-200 h-full w-[65%]"></div>
                </div>
                <div className="text-xs font-bold w-10 text-right dark:text-slate-300">65%</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-16 sm:w-24 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Dining</div>
                <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[20%]"></div>
                </div>
                <div className="text-xs font-bold w-10 text-right dark:text-slate-300">20%</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-16 sm:w-24 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Transit</div>
                <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-slate-400 dark:bg-slate-500 h-full w-[15%]"></div>
                </div>
                <div className="text-xs font-bold w-10 text-right dark:text-slate-300">15%</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-center">
              <button className="w-full py-3 bg-emerald-600 dark:bg-emerald-700 text-white rounded font-black text-sm uppercase tracking-widest shadow-lg shadow-emerald-200 dark:shadow-none transition-all hover:bg-emerald-700 dark:hover:bg-emerald-600">Add New Expense</button>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Members */}
        <div className="w-full lg:w-64 flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 sm:p-5 flex flex-col shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Trip Members</h3>
              <div className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">{members.length}</div>
            </div>
            
            <div className="flex flex-col gap-3">
              {members.map(member => {
                const memberIdentifier = member.name || member.email || 'Anonymous';
                const initial = member.name ? member.name.charAt(0) : (member.email ? member.email.charAt(0) : '?');
                return (
                  <div key={member.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className={cn(
                      "w-8 h-8 rounded-full border border-white/20 dark:border-slate-800/50 flex items-center justify-center font-bold text-white uppercase text-xs shrink-0 shadow-sm",
                      getAvatarColor(memberIdentifier)
                    )}>
                      {initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                        {member.name || member.email?.split('@')[0] || 'Anonymous'}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-500 uppercase font-bold tracking-widest truncate">
                        {member.role === 'admin' ? 'Admin' : 'Member'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {role === 'admin' && (
              <button 
                onClick={handleGenerateInvite}
                className="mt-4 w-full py-2 border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded font-bold text-xs uppercase tracking-widest hover:border-slate-400 dark:hover:border-slate-600 hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex items-center justify-center gap-2"
              >
                <span>+ Invite</span>
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Bottom App Rail (Mobile) */}
      <nav className="sm:hidden h-16 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-around px-4 sticky bottom-0 z-40">
        <div className="flex flex-col items-center gap-1 cursor-pointer">
          <div className="w-5 h-5 border-2 border-emerald-600 dark:border-emerald-500"></div>
          <span className="text-[10px] font-bold uppercase tracking-tighter text-emerald-600 dark:text-emerald-500">Dashboard</span>
        </div>
        <div className="flex flex-col items-center gap-1 cursor-pointer opacity-40">
          <div className="w-5 h-5 border-2 border-slate-900 dark:border-slate-100"></div>
          <span className="text-[10px] font-bold uppercase tracking-tighter dark:text-slate-100">Expenses</span>
        </div>
        <div className="flex flex-col items-center gap-1 cursor-pointer opacity-40">
          <div className="w-5 h-5 border-2 border-slate-900 dark:border-slate-100"></div>
          <span className="text-[10px] font-bold uppercase tracking-tighter dark:text-slate-100">Members</span>
        </div>
        {role === 'admin' && (
          <>
            <div 
              onClick={handleGenerateInvite}
              className="flex flex-col items-center gap-1 cursor-pointer"
            >
              <div className="w-5 h-5 border-2 border-slate-900 dark:border-slate-100 flex items-center justify-center font-bold text-xs dark:text-slate-100">+</div>
              <span className="text-[10px] font-bold uppercase tracking-tighter text-slate-900 dark:text-slate-100">Invite</span>
            </div>
            <div 
              onClick={handleOpenSettings}
              className="flex flex-col items-center gap-1 cursor-pointer"
            >
              <div className="w-5 h-5 flex items-center justify-center text-slate-900 dark:text-slate-100 text-lg">⚙️</div>
              <span className="text-[10px] font-bold uppercase tracking-tighter text-slate-900 dark:text-slate-100">Settings</span>
            </div>
          </>
        )}
      </nav>

      {/* Add Expense Modal */}
      {isAddExpenseModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-sm overflow-hidden flex flex-col border border-transparent dark:border-slate-800">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
              <h3 className="font-black uppercase tracking-tight text-slate-800 dark:text-slate-100">Add Expense</h3>
              <button 
                onClick={() => setIsAddExpenseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleAddExpense} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Description</label>
                  <input 
                    type="text" 
                    value={newExpenseDesc}
                    onChange={(e) => setNewExpenseDesc(e.target.value)}
                    placeholder="e.g. Dinner at Luigi's"
                    required
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex flex-col gap-1 flex-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400 font-bold">$</span>
                      <input 
                        type="number" 
                        step="0.01"
                        min="0"
                        value={newExpenseAmount}
                        onChange={(e) => setNewExpenseAmount(e.target.value)}
                        placeholder="0.00"
                        required
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded pl-7 pr-3 py-2 text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 flex-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Date</label>
                    <input 
                      type="date" 
                      value={newExpenseDate}
                      onChange={(e) => setNewExpenseDate(e.target.value)}
                      required
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Category</label>
                  <select
                    value={newExpenseCategory}
                    onChange={(e) => setNewExpenseCategory(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  >
                    <option>Food & Dining</option>
                    <option>Transport</option>
                    <option>Lodging</option>
                    <option>Activities</option>
                    <option>General</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Paid By</label>
                  <select
                    value={newExpensePaidBy}
                    onChange={(e) => setNewExpensePaidBy(e.target.value)}
                    required
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="" disabled>Select member...</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.name || m.email}</option>
                    ))}
                  </select>
                </div>
                <button 
                  type="submit"
                  disabled={addExpenseLoading}
                  className="w-full mt-2 py-3 bg-emerald-600 text-white rounded font-black text-sm uppercase tracking-widest shadow-lg transition-all hover:bg-emerald-700 disabled:opacity-50"
                >
                  {addExpenseLoading ? 'Adding...' : 'Save Expense'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-sm overflow-hidden flex flex-col border border-transparent dark:border-slate-800">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
              <h3 className="font-black uppercase tracking-tight text-slate-800 dark:text-slate-100">Invite Friends</h3>
              <button 
                onClick={() => setIsInviteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6 flex flex-col items-center text-center">
              {inviteLoading ? (
                <div className="py-10">
                  <div className="w-8 h-8 bg-emerald-600 rounded-sm flex items-center justify-center text-white font-bold text-xl animate-pulse mx-auto mb-4">$</div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest animate-pulse">Generating Invite...</p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 font-medium">Have your friends scan this code or use the link below to join.</p>
                  {qrCodeUrl && (
                    <div className="bg-white p-2 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm mb-6 inline-block">
                      <Image src={qrCodeUrl} alt="Trip Invite QR Code" width={192} height={192} className="w-48 h-48" />
                    </div>
                  )}
                  <div className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md p-3 mb-2 flex items-center justify-between group">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate mr-2">{inviteUrl}</span>
                    <button 
                      onClick={() => navigator.clipboard.writeText(inviteUrl)}
                      className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 whitespace-nowrap"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Link expires in 7 days</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-sm overflow-hidden flex flex-col border border-transparent dark:border-slate-800">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
              <h3 className="font-black uppercase tracking-tight text-slate-800 dark:text-slate-100">Trip Settings</h3>
              <button 
                onClick={() => setIsSettingsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleSaveSettings} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Trip Name</label>
                  <input 
                    type="text" 
                    value={editTripName}
                    onChange={(e) => setEditTripName(e.target.value)}
                    required
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Description (Optional)</label>
                  <input 
                    type="text" 
                    value={editTripDesc}
                    onChange={(e) => setEditTripDesc(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={isSavingSettings}
                  className="w-full mt-2 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded font-black text-sm uppercase tracking-widest shadow-lg transition-all hover:bg-slate-800 dark:hover:bg-white disabled:opacity-50"
                >
                  {isSavingSettings ? 'Saving...' : 'Save Changes'}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-red-100 dark:border-red-900/30">
                <h4 className="text-xs font-bold text-red-500 dark:text-red-400 uppercase tracking-widest mb-2">Danger Zone</h4>
                <button 
                  onClick={handleArchiveTrip}
                  disabled={isArchiving}
                  className="w-full py-2 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-500 rounded font-bold text-xs uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50"
                >
                  {isArchiving ? 'Archiving...' : 'Archive Trip'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
