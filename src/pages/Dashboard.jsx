import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut } from 'lucide-react';

export default function Dashboard() {
  const { currentUser, userData, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#F2F2F7]">
      <div className="sticky top-0 z-50 bg-[#F2F2F7]/90 backdrop-blur-xl border-b border-gray-300/[0.3]">
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-2 flex justify-between items-end mb-2">
            <div>
                 <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Crescent OS</h2>
                 <h1 className="text-3xl font-bold text-black tracking-tight">My Ticket</h1>
            </div>
             <button
                onClick={logout}
                className="p-2 -mr-2 text-[#007AFF] font-medium text-[17px] active:opacity-60 transition-opacity"
            >
                Sign Out
            </button>
        </div>
      </div>

      <main className="max-w-2xl mx-auto py-8 px-4">
        {/* iOS Grouped List Style */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
             <div className="bg-green-500 px-6 py-8 text-center">
                 <div className="mx-auto bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                 </div>
                 <h2 className="text-2xl font-bold text-white mb-1">{userData?.selectedTopicName}</h2>
                 <p className="text-green-100 font-medium text-sm uppercase tracking-wide">Confirmed Selection</p>
             </div>
             
             <div className="divide-y divide-gray-100">
                 <div className="px-6 py-4 flex justify-between items-center">
                     <span className="text-[15px] font-medium text-black">Student Name</span>
                     <span className="text-[15px] text-gray-500">{currentUser?.displayName}</span>
                 </div>
                 <div className="px-6 py-4 flex justify-between items-center">
                     <span className="text-[15px] font-medium text-black">Email</span>
                     <span className="text-[15px] text-gray-500">{currentUser?.email}</span>
                 </div>
                 <div className="px-6 py-4 flex justify-between items-center bg-gray-50/50">
                     <span className="text-[15px] font-medium text-black">Status</span>
                     <span className="text-[13px] font-semibold text-green-600 bg-green-100 px-2.5 py-0.5 rounded-full">LOCKED</span>
                 </div>
             </div>
        </div>
        
        <p className="text-center text-[13px] text-gray-400 max-w-xs mx-auto">
            Your selection is permanently locked. Contact an administrator if this is an error.
        </p>
      </main>
    </div>
  );
}
