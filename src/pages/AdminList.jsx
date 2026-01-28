import React, { useEffect, useMemo, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  doc,
  writeBatch,
  setDoc,
  updateDoc,
  getDoc
} from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import * as XLSX from "xlsx";
import { Trash2 } from "lucide-react";
import { osTopics } from "../data/osTopics";
import { useNavigate } from "react-router-dom";

export default function AdminList() {
  const { currentUser, userRole } = useAuth(); // assume userRole = "admin" | "student"
  const navigate = useNavigate();

  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const pageSize = 8;

  // 🔐 Admin Guard
  useEffect(() => {
    if (!currentUser || userRole !== "admin") {
      navigate("/login");
    }
  }, [currentUser, userRole, navigate]);

  // 🔄 Real-time Fetch
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snapshot) => {
      const data = snapshot.docs.map((doc) => {
        const d = doc.data();
        return {
          uid: doc.id,
          name: d.name,
          email: d.email,
          topicId: d.selectedTopicId,
          topic: d.selectedTopicName || "N/A",
          time: d.createdAt ? d.createdAt.toDate().toLocaleString() : "N/A"
        };
      });
      setAllocations(data);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // 🔍 Search
  const filtered = useMemo(() => {
    return allocations.filter((a) =>
      [a.name, a.email, a.topic].some((field) =>
        field?.toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [allocations, search]);

  // 📄 Pagination
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  // 📤 Export
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filtered.map((a) => ({
        Name: a.name,
        Email: a.email,
        Topic: a.topic,
        Time: a.time
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Allocations");
    XLSX.writeFile(wb, "Topic_Allocations.xlsx");
  };

  // ❌ Unselect Topic
  const handleUnselect = async (row) => {
    if (!row.topicId) return;
    if (!window.confirm(`Unselect "${row.topic}" for ${row.name}?`)) return;

    try {
      const batch = writeBatch(db);

      batch.update(doc(db, "users", row.uid), {
        selectedTopicId: null,
        selectedTopicName: null
      });

      batch.update(doc(db, "topics", row.topicId), {
        selectedBy: null,
        selectedByEmail: null,
        selectedAt: null
      });

      await batch.commit();
      alert("Selection removed.");
    } catch (err) {
      console.error(err);
      alert("Failed to unselect.");
    }
  };

  // 🌱 Seed Topics
  const seedTopics = async () => {
    if (!window.confirm(`Seed ${osTopics.length} topics?`)) return;

    try {
      const batch = writeBatch(db);

      for (const t of osTopics) {
        const ref = doc(db, "topics", t.id);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          batch.set(ref, {
            name: t.name,
            description: t.description,
            selectedBy: null,
            selectedByEmail: null,
            selectedAt: null
          });
        } else {
          batch.update(ref, {
            name: t.name,
            description: t.description
          });
        }
      }

      await batch.commit();
      alert("Topics seeded successfully.");
    } catch (e) {
      console.error(e);
      alert("Error seeding topics.");
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-gray-400">Loading allocations...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F2F2F7]">
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex justify-between mb-4">
          <h1 className="text-2xl font-bold">Admin Allocations</h1>
          <div className="space-x-3">
            <button onClick={seedTopics} className="text-blue-600">Seed</button>
            <button onClick={exportToExcel} className="text-blue-600">Export</button>
          </div>
        </div>

        <input
          placeholder="Search name, email, topic..."
          className="w-full mb-4 p-2 rounded border"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />

        <table className="w-full bg-white rounded shadow overflow-hidden">
          <thead className="bg-gray-100 text-left text-sm">
            <tr>
              <th className="p-3">Student</th>
              <th className="p-3">Email</th>
              <th className="p-3">Topic</th>
              <th className="p-3">Time</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((row) => (
              <tr key={row.uid} className="border-t hover:bg-gray-50">
                <td className="p-3">{row.name}</td>
                <td className="p-3 text-gray-500">{row.email}</td>
                <td className="p-3">{row.topic}</td>
                <td className="p-3 text-xs text-gray-400">{row.time}</td>
                <td className="p-3 text-center">
                  {row.topicId && (
                    <button onClick={() => handleUnselect(row)} className="text-red-500">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex justify-center gap-2 mt-4">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
          <span>Page {page} / {totalPages || 1}</span>
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      </div>
    </div>
  );
}
