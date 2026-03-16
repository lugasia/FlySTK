import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';

export default function PasswordRecovery() {
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const { setIsPasswordRecovery } = useAuth();

  const handleSetNewPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) return;
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPasswordUpdated(true);
      // Clear recovery mode after a brief delay, then reload to normal app
      setTimeout(() => {
        setIsPasswordRecovery(false);
        window.location.href = '/';
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0F1E]">
      <div className="w-full max-w-md p-10 rounded-2xl bg-[#0F1629] border border-white/[0.06] shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <img src="/fcic.png" alt="Flycomm" className="w-64 mb-8 object-contain" />
          <h2 className="text-xl font-bold text-slate-100">Set New Password</h2>
          <p className="text-sm text-slate-400 mt-2">Enter your new password below</p>
        </div>
        {passwordUpdated ? (
          <div className="text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
              <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm text-slate-300">Password updated. Redirecting...</p>
          </div>
        ) : (
          <form onSubmit={handleSetNewPassword} className="space-y-3">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min 6 characters)"
              required
              minLength={6}
              className="w-full px-4 py-2.5 rounded-lg bg-[#1A2238] border border-white/[0.08] text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
            />
            <button
              type="submit"
              disabled={loading || newPassword.length < 6}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
            {error && <p className="text-center text-sm text-red-400">{error}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
