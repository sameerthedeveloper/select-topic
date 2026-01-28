import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, writeBatch, setDoc, updateDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import * as XLSX from 'xlsx';
import { Download, Trash2, Lock, Check, X } from 'lucide-react';
import { osTopics } from '../data/osTopics';

export default function AdminList() {
  const [allocations, setAllocations] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [password, setPassword] = useState('');

  async function fetchData() {
      try {
          const usersRef = collection(db, 'users');
          const snapshot = await getDocs(usersRef);
          const data = snapshot.docs.map(doc => {
              const d = doc.data();
              return {
                  uid: doc.id,
                  name: d.name,
                  email: d.email,
                  topicId: d.selectedTopicId,
                  topic: d.selectedTopicName || 'N/A',
                  time: d.createdAt ? d.createdAt.toDate().toLocaleString() : 'N/A',
                  rrn: d.rrn,
                  status: d.status
              };
          });
          setAllocations(data.filter(u => u.status !== 'pending' && (u.email.endsWith('@crescent.education') || u.status === 'approved')));
          setPendingUsers(data.filter(u => u.status === 'pending'));
      } catch (error) {
          console.error("Error fetching data", error);
      } finally {
          setLoading(false);
      }
  }

  useEffect(() => {
    if (isAdminAuth) {
      fetchData();
    }
  }, [isAdminAuth]);

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(allocations.map(a => ({
        Name: a.name.replace(/BTech CSE 2024/gi, '').trim(),
        Email: a.email.replace(/@crescent\.education/gi, '').trim(),
        Topic: a.topic,
        Time: a.time
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Allocations");
    XLSX.writeFile(workbook, "Topic_Allocations.xlsx");
  };

  const handleUnselect = async (allocation) => {
      if (!allocation.topicId) return;
      if (!window.confirm(`Are you sure you want to unselect "${allocation.topic}" for ${allocation.name}?`)) return;

      try {
          const batch = writeBatch(db);
          
          // Reset User Data
          const userRef = doc(db, 'users', allocation.uid);
          batch.update(userRef, {
              selectedTopicId: null,
              selectedTopicName: null,
              createdAt: null
          });

          // Reset Topic Data
          const topicRef = doc(db, 'topics', allocation.topicId);
          batch.update(topicRef, {
              selectedBy: null,
              selectedByEmail: null,
              selectedAt: null
          });

          await batch.commit();
          alert("Selection removed successfully.");
          fetchData(); // Refresh list
      } catch (error) {
          console.error("Error unselecting topic:", error);
          alert("Failed to unselect topic.");
      }
  };

  const seedTopics = async () => {
      if(!window.confirm(`This will add up to ${osTopics.length} topics (only missing ones). Continue?`)) return;
      
      setLoading(true);
      let addedCount = 0;
      let existingCount = 0;

      try {
          for (const t of osTopics) {
              const topicRef = doc(db, 'topics', t.id);
              const docSnap = await getDoc(topicRef);
              
              if (!docSnap.exists()) {
                  await setDoc(topicRef, {
                      name: t.name,
                      description: t.description,
                      selectedBy: null,
                      selectedByEmail: null,
                      selectedAt: null
                  });
                  addedCount++;
              } else {
                  // Only update name/description, preserve selection state
                  await updateDoc(topicRef, {
                      name: t.name,
                      description: t.description
                  });
                  existingCount++;
              }
          }
          alert(`Seeding complete.\nAdded: ${addedCount}\nUpdated/Skipped: ${existingCount}`);
      } catch (e) {
          console.error("Error seeding topics", e);
          alert("Error seeding topics. Check console.");
      } finally {
          setLoading(false);
      }
  };

  const handleApprove = async (uid) => {
      try {
          await updateDoc(doc(db, 'users', uid), { status: 'approved' });
          fetchData();
      } catch (e) {
          console.error("Error approving:", e);
          alert("Failed to approve.");
      }
  };

  const handleReject = async (uid) => {
      if(!window.confirm("Reject this user? This will delete their request.")) return;
      try {
          await deleteDoc(doc(db, 'users', uid));
          fetchData();
      } catch (e) {
          console.error("Error rejecting:", e);
          alert("Failed to reject.");
      }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'admin') {
      setIsAdminAuth(true);
    } else {
      alert('Incorrect password');
    }
  };

  if (!isAdminAuth) {
    return (
      <div className="min-h-screen bg-[#F2F2F7] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-sm w-full">
          <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-gray-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Admin Access</h2>
          <p className="text-gray-500 text-sm mb-6">Enter password to view allocations.</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF] transition-all"
              placeholder="Password"
              autoFocus
            />
            <button
              type="submit"
              className="w-full bg-[#007AFF] hover:bg-[#007AFF]/90 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
            >
              Unlock
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F2F7]">
      <div className="sticky top-0 z-50 bg-[#F2F2F7]/90 backdrop-blur-xl border-b border-gray-300/[0.3]">
        <div className="max-w-6xl mx-auto px-4 pt-4 pb-2 flex justify-between items-end mb-2">
             <div>
                 <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Admin Console</h2>
                 <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold text-black tracking-tight">Allocations</h1>
                    <span className="bg-gray-200 text-gray-600 text-sm font-semibold px-2.5 py-0.5 rounded-full dark:bg-gray-700 dark:text-gray-300">
                        {allocations.length}
                    </span>
                 </div>
            </div>
            <div className="flex space-x-3">
                 <button
                    onClick={seedTopics}
                    className="p-2 text-[#007AFF] font-medium text-[17px] active:opacity-60 transition-opacity"
                >
                    Seed
                </button>
                <button
                    onClick={exportToExcel}
                    className="p-2 text-[#007AFF] font-medium text-[17px] active:opacity-60 transition-opacity"
                >
                    Export
                </button>
            </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-8">
        
        {/* Pending Approvals Section */}
        {pendingUsers.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-orange-100">
                <div className="px-6 py-4 border-b border-orange-100 bg-orange-50/50 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-orange-800 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                        Pending Approvals ({pendingUsers.length})
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-orange-50/30">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-orange-600 uppercase tracking-wider">RRN</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-orange-600 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-orange-600 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-orange-600 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-orange-100">
                            {pendingUsers.map((user) => (
                                <tr key={user.uid} className="hover:bg-orange-50/30 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-[15px] font-bold text-gray-900">{user.rrn}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-[15px] text-gray-900">{user.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-[15px] text-gray-500">{user.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                                        <button
                                            onClick={() => handleApprove(user.uid)}
                                            className="inline-flex items-center px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
                                        >
                                            <Check className="w-4 h-4 mr-1.5" />
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleReject(user.uid)}
                                            className="inline-flex items-center px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                                        >
                                            <X className="w-4 h-4 mr-1.5" />
                                            Reject
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* Allocations Table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Student</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Topic</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Time</th>
                            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {allocations.map((row, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 transition-colors group">
                                <td className="px-6 py-4 whitespace-nowrap text-[15px] font-medium text-gray-900">{row.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-[15px] text-gray-500">{row.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-[15px] text-gray-900 font-medium">{row.topic}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-[13px] text-gray-400 tabular-nums">{row.time}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    {row.topicId ? (
                                        <button
                                            onClick={() => handleUnselect(row)}
                                            className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    ) : (
                                        <span className="text-gray-300">-</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                         {allocations.length === 0 && !loading && (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-gray-400 italic">No allocations found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
}
