'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/src/components/AuthProvider';
import { useRouter, useParams } from 'next/navigation';

export default function InvitePage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  
  const [tripInfo, setTripInfo] = useState<{tripName: string, tripDescription: string | null} | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInviteInfo = async () => {
      try {
        const res = await fetch(`/api/invite/${params.token}`);
        if (res.ok) {
          const data = await res.json();
          setTripInfo(data.trip);
        } else {
          setError('Invite not found or expired');
        }
      } catch (err) {
        setError('Failed to fetch invite details');
      } finally {
        setLoading(false);
      }
    };

    if (params.token) {
      fetchInviteInfo();
    }
  }, [params.token]);

  const handleJoin = async () => {
    if (!user) return;
    setJoining(true);
    setError('');

    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/invite/${params.token}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        router.push(`/trips/${data.tripId}`);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to join trip');
        setJoining(false);
      }
    } catch (err) {
      setError('An error occurred while joining');
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 bg-emerald-600 rounded-sm flex items-center justify-center text-white font-bold text-xl animate-pulse">$</div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">Loading Invite...</div>
        </div>
      </div>
    );
  }

  if (error || !tripInfo) {
    return (
      <div className="flex flex-col h-screen w-full items-center justify-center bg-slate-50 gap-4">
        <div className="text-red-500 text-4xl">⚠️</div>
        <h2 className="text-xl font-bold text-slate-800">{error || 'Invalid Invite'}</h2>
        <button 
          onClick={() => router.push('/')}
          className="mt-4 px-6 py-2 bg-slate-900 text-white rounded text-xs font-bold uppercase tracking-widest"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50 text-slate-900 font-sans p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden flex flex-col text-center">
        <div className="p-8 border-b border-slate-100 flex flex-col items-center gap-4 bg-slate-50/50">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 text-3xl shadow-sm mb-2">
            ✈️
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800 uppercase">You&apos;re Invited!</h1>
          <p className="text-sm text-slate-500">You&apos;ve been invited to join a trip on Lunch Money.</p>
        </div>

        <div className="p-8 flex-1 flex flex-col gap-6">
          <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-2">{tripInfo.tripName}</h2>
            {tripInfo.tripDescription && (
              <p className="text-sm text-slate-500">{tripInfo.tripDescription}</p>
            )}
          </div>
          
          <button
            onClick={handleJoin}
            disabled={joining}
            className="w-full py-4 bg-emerald-600 text-white rounded font-black text-sm uppercase tracking-widest shadow-lg shadow-emerald-200 transition-all hover:bg-emerald-700 disabled:opacity-50"
          >
            {joining ? 'Joining...' : 'Join Trip'}
          </button>
          
          <button
            onClick={() => router.push('/')}
            className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
