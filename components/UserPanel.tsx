import React, { useState } from 'react';
import { User } from '../types';
import { OTPDisplay } from './OTPDisplay';
import { LogOut, Eye, EyeOff, Lock, User as UserIcon } from 'lucide-react';

interface UserPanelProps {
  user: User;
  onLogout: () => void;
}

export const UserPanel: React.FC<UserPanelProps> = ({ user, onLogout }) => {
  // Changed default to true so key is visible by default
  const [showSecret, setShowSecret] = useState(true);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px]" />

      <div className="w-full max-w-lg relative z-10 space-y-6">
        
        {/* Header Card */}
        <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700 p-6 rounded-2xl shadow-2xl">
          <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
             <div className="flex items-center gap-3">
               <div className="p-2 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-lg">
                 <UserIcon className="w-6 h-6 text-white" />
               </div>
               <div>
                 <h1 className="text-xl font-bold text-white tracking-wide">{user.username}</h1>
                 <p className="text-xs text-slate-400">Secure Access Dashboard</p>
               </div>
             </div>
             <button 
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
             >
               <LogOut className="w-5 h-5" />
             </button>
          </div>

          {/* Secret Display Section */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1 block">Your Private Key</label>
            <div className="relative">
              <div className="w-full bg-slate-900 border border-slate-600 rounded-lg py-3 px-4 flex items-center justify-between">
                 <div className={`font-mono text-sm text-slate-300 truncate pr-4 ${!showSecret ? 'blur-sm select-none' : ''}`}>
                   {user.secret}
                 </div>
                 <button 
                  onClick={() => setShowSecret(!showSecret)}
                  className="text-slate-500 hover:text-indigo-400 transition-colors"
                 >
                   {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                 </button>
              </div>
              {!showSecret && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-xs text-slate-500 font-medium bg-slate-900/80 px-2 py-1 rounded border border-slate-700">Hidden for security</span>
                </div>
              )}
            </div>
            <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-2">
              <Lock className="w-3 h-3" />
              This key is read-only. Contact an administrator to change it.
            </p>
          </div>
        </div>

        {/* Live OTP Component */}
        <OTPDisplay secret={user.secret} />

        {/* Footer Info */}
        <div className="text-center">
          <p className="text-slate-600 text-xs">
            System generated at {new Date().toLocaleTimeString()}
          </p>
        </div>

      </div>
    </div>
  );
};