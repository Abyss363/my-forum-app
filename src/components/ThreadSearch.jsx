import { useState } from "react";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "../firebase";

function ThreadSearch({ onSelect, onClose }) {
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

    const filtered = allThreads.filter((thread) =>
      thread.title.toLowerCase().includes(value.toLowerCase()),
    );
    setResults(filtered);
    setLoading(false);
  }

  return (
    <div className="border-2 border-blue-200 rounded-xl p-4 mb-4 bg-blue-50">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-sm font-bold text-blue-700">
          🔍 Search for a thread to reference
        </h4>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 font-bold"
        >
          ✕
        </button>
      </div>

      <input
        type="text"
        placeholder="Type a thread title..."
        value={searchQuery}
        onChange={handleSearch}
        className="w-full border border-gray-300 rounded-lg p-2 mb-3 outline-none focus:border-blue-500 bg-white text-sm"
      />

      {loading && <p className="text-blue-500 text-sm">Searching...</p>}

      {results.length === 0 && searchQuery && !loading && (
        <p className="text-gray-400 text-sm">No threads found.</p>
      )}

      <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
        {results.map((thread) => (
          <div
            key={thread.id}
            onClick={() => onSelect({ id: thread.id, title: thread.title })}
            className="bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors duration-200"
          >
            <p className="text-sm font-bold text-gray-700 line-clamp-1">
              {thread.title}
            </p>
            <p className="text-xs text-gray-400 line-clamp-1">{thread.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ThreadSearch;
