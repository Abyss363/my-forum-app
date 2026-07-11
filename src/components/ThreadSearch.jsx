import { useState } from "react";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "../firebase";

function ThreadSearch({ onSelect, onClose, user, rooms }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch(e) {
    const value = e.target.value;
    setSearchQuery(value);

    if (!value.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    const q = query(collection(db, "threads"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const allThreads = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    const filtered = allThreads.filter((thread) => {
      if (!thread.title.toLowerCase().includes(value.toLowerCase()))
        return false;
      if (!thread.roomId) return true;
      const room = rooms?.find((r) => r.id === thread.roomId);
      if (!room) return false;
      return room.members?.includes(user.uid);
    });
    setResults(filtered);
    setLoading(false);
  }

  return (
    <div className="border-2 border-blue-800 rounded-xl p-4 mb-4 bg-blue-900/20">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-sm font-bold text-blue-400">
          🔍 Search for a thread to reference
        </h4>
        <button
          onClick={onClose}
          className="text-[#4a5066] hover:text-[#8b92a5] font-bold transition-colors duration-200"
        >
          ✕
        </button>
      </div>

      <input
        type="text"
        placeholder="Type a thread title..."
        value={searchQuery}
        onChange={handleSearch}
        className="w-full border border-[#2a2d3a] rounded-lg p-2 mb-3 outline-none focus:border-blue-500 bg-[#0f1117] text-[#e2e8f0] text-sm"
      />

      {loading && <p className="text-blue-400 text-sm">Searching...</p>}

      {results.length === 0 && searchQuery && !loading && (
        <p className="text-[#4a5066] text-sm">No threads found.</p>
      )}

      <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
        {results.map((thread) => (
          <div
            key={thread.id}
            onClick={() => onSelect({ id: thread.id, title: thread.title })}
            className="bg-[#0f1117] border border-[#2a2d3a] rounded-lg p-3 cursor-pointer hover:border-blue-800 hover:bg-blue-900/20 transition-colors duration-200"
          >
            <p className="text-sm font-bold text-[#e2e8f0] line-clamp-1">
              {thread.title}
            </p>
            <p className="text-xs text-[#4a5066] line-clamp-1">{thread.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ThreadSearch;
