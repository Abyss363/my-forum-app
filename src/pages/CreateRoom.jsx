import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

function CreateRoom({ user, userProfile }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleCreate() {
    if (!name.trim()) {
      setError("Please enter a room name.");
      return;
    }
    if (isPasswordProtected && !password.trim()) {
      setError("Please enter a password for the room.");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "rooms"), {
        name: name,
        description: description,
        password: isPasswordProtected ? password : null,
        isPasswordProtected: isPasswordProtected,
        createdBy: user.uid,
        createdByName: userProfile.displayName,
        members: [user.uid],
        createdAt: serverTimestamp(),
      });
      navigate("/");
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0f1117]">
      <nav className="bg-[#1a1d27] border-b border-[#2a2d3a] px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold tracking-widest uppercase bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
          🎓 AJU Forum
        </h1>
        <button
          onClick={() => navigate("/")}
          className="text-blue-400 font-bold hover:text-blue-300 transition-colors duration-200"
        >
          ← Back
        </button>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-[#e2e8f0] mb-6">
          Create a Room
        </h2>

        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-6">
          {error && <p className="text-rose-400 text-sm mb-4">{error}</p>}

          <input
            type="text"
            placeholder="Room name (e.g. CSC 301 Class)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-[#2a2d3a] rounded-lg p-3 mb-4 outline-none focus:border-blue-500 bg-[#0f1117] text-[#e2e8f0]"
          />

          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full border border-[#2a2d3a] rounded-lg p-3 mb-4 outline-none focus:border-blue-500 resize-none bg-[#0f1117] text-[#e2e8f0]"
          />

          <div className="flex items-center gap-3 mb-4">
            <input
              type="checkbox"
              id="passwordProtected"
              checked={isPasswordProtected}
              onChange={(e) => setIsPasswordProtected(e.target.checked)}
              className="w-4 h-4 accent-blue-600"
            />
            <label
              htmlFor="passwordProtected"
              className="text-sm font-bold text-[#8b92a5]"
            >
              Password protect this room
            </label>
          </div>

          {isPasswordProtected && (
            <input
              type="password"
              placeholder="Room password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-[#2a2d3a] rounded-lg p-3 mb-4 outline-none focus:border-blue-500 bg-[#0f1117] text-[#e2e8f0]"
            />
          )}

          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200"
          >
            {loading ? "Creating..." : "Create Room"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateRoom;
