'use client';

import React from 'react';
import { useAuth } from '@/src/components/AuthProvider';
import { auth } from '@/src/lib/firebase';
import { signOut } from 'firebase/auth';

export default function Dashboard() {
  const { user } = useAuth();

  const handleSignOut = () => {
    signOut(auth);
  };

  if (!user) return null; // AuthProvider handles redirect

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header Navigation */}
      <header className="flex items-center justify-between px-4 sm:px-8 h-16 bg-white border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-600 rounded-sm flex items-center justify-center text-white font-bold text-xl">$</div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 uppercase hidden sm:block">Lunch Money</h1>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-md">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:inline">Trip:</span>
            <span className="text-sm font-bold text-slate-800">Iceland Road Trip '24</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-slate-600 uppercase">
              {user.email?.charAt(0)}
            </div>
            <button 
              onClick={handleSignOut}
              className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-slate-800"
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
            <div className="bg-white p-5 border border-slate-200 rounded-lg shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Spent</p>
              <p className="text-3xl font-black text-slate-900">$4,821.50</p>
              <div className="mt-2 text-xs text-emerald-600 font-medium">+ $210.00 today</div>
            </div>
            <div className="bg-white p-5 border border-slate-200 rounded-lg shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Your Balance</p>
              <p className="text-3xl font-black text-emerald-600">+$142.20</p>
              <div className="mt-2 text-xs text-slate-500 font-medium">Net: 3 owes, 2 owed</div>
            </div>
            <div className="bg-emerald-600 p-5 rounded-lg shadow-sm text-white">
              <p className="text-xs font-bold text-emerald-100 uppercase tracking-widest mb-1">Group Health</p>
              <p className="text-3xl font-black uppercase tracking-tighter italic">BALANCED</p>
              <div className="mt-2 text-xs text-emerald-100 font-medium">All receipts verified</div>
            </div>
          </div>

          {/* Recent Expenses Section */}
          <div className="flex-1 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
            <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold uppercase tracking-widest text-xs text-slate-500">Recent Expenses</h3>
              <button className="text-emerald-600 text-xs font-bold uppercase tracking-tighter">View All History</button>
            </div>
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-sm text-left min-w-[500px]">
                <thead className="bg-white text-slate-400 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 border-b">Description</th>
                    <th className="px-4 sm:px-6 py-3 border-b">Paid By</th>
                    <th className="px-4 sm:px-6 py-3 border-b text-right">Amount</th>
                    <th className="px-4 sm:px-6 py-3 border-b text-center">Split</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50">
                    <td className="px-4 sm:px-6 py-4">
                      <div className="font-bold text-slate-800">Rental SUV Gas</div>
                      <div className="text-xs text-slate-400 italic">Transport • July 12</div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-slate-600 font-medium">Alex M.</td>
                    <td className="px-4 sm:px-6 py-4 text-right font-bold text-slate-900 italic">$124.00</td>
                    <td className="px-4 sm:px-6 py-4 text-center"><span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase">Equal</span></td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="px-4 sm:px-6 py-4">
                      <div className="font-bold text-slate-800">Borgarhafnir Lobster</div>
                      <div className="text-xs text-slate-400 italic">Food & Dining • July 11</div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-slate-600 font-medium">You</td>
                    <td className="px-4 sm:px-6 py-4 text-right font-bold text-slate-900 italic">$342.10</td>
                    <td className="px-4 sm:px-6 py-4 text-center"><span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase">Custom</span></td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="px-4 sm:px-6 py-4">
                      <div className="font-bold text-slate-800">Vik Glamping Stay</div>
                      <div className="text-xs text-slate-400 italic">Lodging • July 10</div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-slate-600 font-medium">Sarah K.</td>
                    <td className="px-4 sm:px-6 py-4 text-right font-bold text-slate-900 italic">$1,200.00</td>
                    <td className="px-4 sm:px-6 py-4 text-center"><span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase">Equal</span></td>
                  </tr>
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
          <div className="flex-1 bg-white border border-slate-200 rounded-lg p-4 sm:p-6 flex flex-col">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-6">Spend Breakdown</h3>
            <div className="flex-1 flex flex-col justify-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-16 sm:w-24 text-[10px] font-bold text-slate-400 uppercase">Lodging</div>
                <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-slate-800 h-full w-[65%]"></div>
                </div>
                <div className="text-xs font-bold w-10 text-right">65%</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-16 sm:w-24 text-[10px] font-bold text-slate-400 uppercase">Dining</div>
                <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[20%]"></div>
                </div>
                <div className="text-xs font-bold w-10 text-right">20%</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-16 sm:w-24 text-[10px] font-bold text-slate-400 uppercase">Transit</div>
                <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-slate-400 h-full w-[15%]"></div>
                </div>
                <div className="text-xs font-bold w-10 text-right">15%</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-center">
              <button className="w-full py-3 bg-emerald-600 text-white rounded font-black text-sm uppercase tracking-widest shadow-lg shadow-emerald-200 transition-all hover:bg-emerald-700">Add New Expense</button>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom App Rail (Mobile) */}
      <nav className="sm:hidden h-16 bg-white border-t border-slate-200 flex items-center justify-around px-4 sticky bottom-0">
        <div className="flex flex-col items-center gap-1 cursor-pointer">
          <div className="w-5 h-5 border-2 border-emerald-600"></div>
          <span className="text-[10px] font-bold uppercase tracking-tighter text-emerald-600">Dashboard</span>
        </div>
        <div className="flex flex-col items-center gap-1 cursor-pointer opacity-40">
          <div className="w-5 h-5 border-2 border-slate-900"></div>
          <span className="text-[10px] font-bold uppercase tracking-tighter">Expenses</span>
        </div>
        <div className="flex flex-col items-center gap-1 cursor-pointer opacity-40">
          <div className="w-5 h-5 border-2 border-slate-900"></div>
          <span className="text-[10px] font-bold uppercase tracking-tighter">Members</span>
        </div>
      </nav>
    </div>
  );
}
