import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, runTransaction, doc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Lock } from 'lucide-react';

export default function TopicSelection() {
  const [topics, setTopics] = useState([]);
  const [filteredTopics, setFilteredTopics] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser, userData, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user already has a topic, redirect to dashboard
    if (userData?.selectedTopicId) {
      navigate('/dashboard');
      return;
    }

    async function fetchTopics() {
      try {
        const topicsRef = collection(db, 'topics');
        const q = query(topicsRef);
        const querySnapshot = await getDocs(q);
        const topicsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        const availableTopics = topicsList.filter(t => !t.selectedBy);
        setTopics(availableTopics);
        setFilteredTopics(availableTopics);
        
      } catch (err) {
        console.error("Error fetching topics:", err);
        setError("Failed to load topics.");
      } finally {
        setLoading(false);
      }
    }

    fetchTopics();
  }, [userData, navigate]);

  useEffect(() => {
    const lowerQuery = searchQuery.toLowerCase();
    const filtered = topics.filter(topic => 
      topic.name.toLowerCase().includes(lowerQuery) || 
      topic.description.toLowerCase().includes(lowerQuery)
    );

    setFilteredTopics(filtered);
  }, [searchQuery, topics])

  const handleSelectTopic = async (topicId, topicName) => {
    if (!window.confirm(`Are you sure you want to select "${topicName}"? This cannot be undone.`)) {
      return;
    }

    setLoading(true);
    try {
      await runTransaction(db, async (transaction) => {
        const topicRef = doc(db, 'topics', topicId);
        const userRef = doc(db, 'users', currentUser.uid);

        const topicDoc = await transaction.get(topicRef);
        if (!topicDoc.exists()) {
          throw "Topic does not exist!";
        }

        if (topicDoc.data().selectedBy) {
          throw "This topic has already been selected by another student.";
        }

        const userDoc = await transaction.get(userRef);
        if (userDoc.exists() && userDoc.data().selectedTopicId) {
             throw "You have already selected a topic.";
        }

        // Lock topic
        transaction.update(topicRef, {
          selectedBy: currentUser.uid,
          selectedByEmail: currentUser.email,
          selectedAt: serverTimestamp()
        });

        // Update user
        transaction.set(userRef, {
          name: currentUser.displayName,
          email: currentUser.email,
          selectedTopicId: topicId,
          selectedTopicName: topicName,
          createdAt: serverTimestamp() // or update time
        }, { merge: true });
      });

      navigate('/dashboard');
      window.location.reload(); // Ensure Context gets fresh data
    } catch (e) {
      console.error("Transaction failed: ", e);
      setError(typeof e === 'string' ? e : "Failed to select topic. Please try again.");
      setLoading(false);
      // Refresh topics list
      const topicsRef = collection(db, 'topics');
      const snapshot = await getDocs(topicsRef);
      const list = snapshot.docs.map(d => ({id: d.id, ...d.data()})).filter(t => !t.selectedBy);
      setTopics(list);
    }
  };


  return (
    <div className="min-h-screen bg-[#F2F2F7]">
      {/* iOS-style Header */}
      <div className="sticky top-0 z-50 bg-[#F2F2F7]/90 backdrop-blur-xl border-b border-gray-300/[0.3]">
          <div className="max-w-4xl mx-auto px-4 pt-4 pb-2">
            <div className="flex justify-between items-end mb-2">
                <div>
                   <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">CHOOSE YOUR OS FOR CAT 1 ASSGMT</h2>
                   <h1 className="text-3xl font-bold text-black tracking-tight">Select Topic</h1>
                </div>
                <button
                    onClick={logout}
                    className="p-2 -mr-2 text-[#007AFF] font-medium text-[17px] active:opacity-60 transition-opacity"
                >
                    Sign Out
                </button>
            </div>
            
            <div className="relative mt-2">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2.5 bg-gray-200/80 border-none rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-0 focus:bg-gray-200 sm:text-[17px] transition-all"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
          </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {error && (
            <div className="mb-6 bg-red-100/80 backdrop-blur-md rounded-2xl p-4 flex items-center shadow-sm">
                 <svg className="w-6 h-6 text-red-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                 <span className="text-red-800 font-medium text-[15px]">{error}</span>
            </div>
        )}
        
        <div className="space-y-4">
          {filteredTopics.map((topic) => (
            <div key={topic.id} className="group bg-white rounded-2xl p-5 shadow-sm active:scale-[0.99] transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between">
              <div className="flex-grow pr-4 mb-4 sm:mb-0">
                  <h3 className="text-[19px] font-semibold text-black mb-1">
                      {topic.name}
                  </h3>
                  <p className="text-[15px] text-gray-500 leading-snug">{topic.description}</p>
              </div>
              <div className="flex-shrink-0">
                  <button
                    onClick={() => handleSelectTopic(topic.id, topic.name)}
                    disabled={loading}
                    className="w-full sm:w-auto px-6 py-2.5 bg-[#007AFF] text-white font-semibold text-[15px] rounded-full hover:bg-[#0062cc] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    Select
                  </button>
              </div>
            </div>
          ))}
          
          {filteredTopics.length === 0 && !loading && (
             <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                 <div className="bg-gray-200 p-4 rounded-full mb-4">
                     <Lock className="h-8 w-8 text-gray-400" />
                 </div>
                 <h3 className="text-xl font-bold text-gray-900">
                     {searchQuery ? "No Results" : "All Booked"}
                 </h3>
                 <p className="mt-2 text-[15px] text-gray-500 max-w-xs mx-auto">
                     {searchQuery ? "Try searching for a different operating system." : "Every available topic has been selected by another student."}
                 </p>
             </div>
          )}
        </div>
      </main>
    </div>

        );
}

