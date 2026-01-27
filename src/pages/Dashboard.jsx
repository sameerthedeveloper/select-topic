import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut } from 'lucide-react';

export default function Dashboard() {
  const { currentUser, userData, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Student Dashboard</h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={logout}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
        <div className="bg-white overflow-hidden shadow-lg sm:rounded-xl ring-1 ring-black ring-opacity-5">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-lg leading-6 font-semibold text-gray-900">
              Selection Status
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Your confirmed OS Topic allocation details.
            </p>
          </div>
          <div className="divide-y divide-gray-100">
            <dl>
              <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 hover:bg-gray-50 transition-colors">
                <dt className="text-sm font-medium text-gray-500">Full name</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-medium">
                  {currentUser?.displayName}
                </dd>
              </div>
              <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 hover:bg-gray-50 transition-colors">
                <dt className="text-sm font-medium text-gray-500">Email address</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {currentUser?.email}
                </dd>
              </div>
              <div className="bg-indigo-50/50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-indigo-700">Selected Topic</dt>
                <dd className="mt-1 text-lg sm:text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-bold text-indigo-700">
                  {userData?.selectedTopicName || "Loading..."}
                </dd>
              </div>
               <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1 text-sm text-green-700 sm:mt-0 sm:col-span-2 font-semibold flex items-center">
                   <svg className="w-5 h-5 mr-1.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                   </svg>
                   Topic Locked. Selection is permanent.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </main>
    </div>
  );
}
