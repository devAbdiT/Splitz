'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/src/components/AuthProvider';
import { auth } from '@/src/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/src/components/ThemeToggle';

interface Trip {
  id: number;
  name: string;
  description: string | null;
  baseCurrency: string;
  role: string;
}

export default function TripsDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create Trip Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTripName, setNewTripName] = useState('');
  const [newTripDesc, setNewTripDesc] = useState('');

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const token = await user?.getIdToken();
        const res = await fetch('/api/trips', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setTrips(data.trips);
        }
      } catch (error) {
        console.error('Failed to fetch trips:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchTrips();
    }
  }, [user]);

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTripName.trim()) return;

    try {
      const token = await user?.getIdToken();
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          name: newTripName,
          description: newTripDesc,
          baseCurrency: 'USD'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setTrips([data.trip, ...trips]);
        setIsModalOpen(false);
        setNewTripName('');
        setNewTripDesc('');
        router.push(`/trips/${data.trip.id}`);
      }
    } catch (error) {
      console.error('Failed to create trip:', error);
    }
  };

  if (!user) return null;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      <header className="flex items-center justify-between px-4 sm:px-8 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-600 rounded-sm flex items-center justify-center text-white font-bold text-xl">$</div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 uppercase">Lunch Money</h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 uppercase">
            {user.email?.charAt(0)}
          </div>
          <button 
            onClick={() => signOut(auth)}
            className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest hover:text-slate-800 dark:hover:text-slate-200"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black uppercase tracking-tight">Your Trips</h2>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 text-white rounded text-xs font-bold uppercase tracking-widest shadow-md hover:bg-emerald-700 transition-colors"
          >
            + New Trip
          </button>
        </div>

        {loading ? (
          <div className="text-center py-10 text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-widest animate-pulse">
            Loading Trips...
          </div>
        ) : trips.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-10 text-center flex flex-col items-center shadow-sm">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl text-slate-400 dark:text-slate-500">✈️</span>
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">No trips yet</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Create a trip to start splitting expenses with friends.</p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-emerald-600 dark:bg-emerald-700 text-white rounded font-black text-sm uppercase tracking-widest shadow-md hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors"
            >
              Create Your First Trip
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <div 
                key={trip.id} 
                onClick={() => router.push(`/trips/${trip.id}`)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md hover:border-emerald-500 dark:hover:border-emerald-500 transition-all group flex flex-col"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">{trip.name}</h3>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                    {trip.role}
                  </span>
                </div>
                {trip.description && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 flex-1">
                    {trip.description}
                  </p>
                )}
                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Base: {trip.baseCurrency}</span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-tighter group-hover:underline">View Trip</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Trip Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
              <h3 className="font-black uppercase tracking-tight text-slate-800 dark:text-slate-100">Create New Trip</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateTrip} className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Trip Name</label>
                <input
                  type="text"
                  value={newTripName}
                  onChange={(e) => setNewTripName(e.target.value)}
                  required
                  autoFocus
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  placeholder="e.g. Iceland Road Trip &apos;24"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Description (Optional)</label>
                <textarea
                  value={newTripDesc}
                  onChange={(e) => setNewTripDesc(e.target.value)}
                  rows={3}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors resize-none"
                  placeholder="A brief description of the trip..."
                />
              </div>
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded font-black text-sm uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTripName.trim()}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded font-black text-sm uppercase tracking-widest shadow-md hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Trip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
