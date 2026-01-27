import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, writeBatch, query, where, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import * as XLSX from 'xlsx';
import { Download, Trash2 } from 'lucide-react';
import { osTopics } from '../data/osTopics';

export default function AdminList() {
  const [allocations, setAllocations] = useState([]);
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);

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
                  time: d.createdAt ? d.createdAt.toDate().toLocaleString() : 'N/A'
              };
          });
          setAllocations(data);
      } catch (error) {
          console.error("Error fetching data", error);
      } finally {
          setLoading(false);
      }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(allocations.map(a => ({
        Name: a.name,
        Email: a.email,
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
              createdAt: null // Or keep createdAt? Probably reset for new selection.
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
          // Optional: Refresh list if we were showing topics here, but we are showing allocations.
      }
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7]">
      <div className="sticky top-0 z-50 bg-[#F2F2F7]/90 backdrop-blur-xl border-b border-gray-300/[0.3]">
        <div className="max-w-6xl mx-auto px-4 pt-4 pb-2 flex justify-between items-end mb-2">
             <div>
                 <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Admin Console</h2>
                 <h1 className="text-3xl font-bold text-black tracking-tight">Allocations</h1>
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

      <div className="max-w-6xl mx-auto p-4 sm:p-6">
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
