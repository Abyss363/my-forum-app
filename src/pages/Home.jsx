import { auth, db } from "../firebase";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  where,
} from "firebase/firestore";
import CreateThread from "./CreateThread";
import Footer from "../components/Footer";
import NotificationBell from "../components/NotificationBell";

function Home({ userProfile, user }) {
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [threads, setThreads] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [rooms, setRooms] = useState([]);
  const [activeTab, setActiveTab] = useState("general");
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [pendingRoom, setPendingRoom] = useState(null);
  const [roomMembers, setRoomMembers] = useState([]);

  useEffect(() => {
    const constraints = [
      orderBy("pinned", "desc"),
      orderBy("createdAt", "desc"),
    ];
    const q =
      activeTab === "general"
        ? query(collection(db, "threads"), ...constraints)
        : query(collection(db, "threads"), ...constraints);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const threadList = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((thread) =>
          activeTab === "general"
            ? !thread.roomId
            : thread.roomId === activeTab,
        );
      setThreads(threadList);
    });
    return () => unsubscribe();
  }, [activeTab]);

  useEffect(() => {
    const q = query(collection(db, "rooms"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const roomList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRooms(roomList);
    });
    return () => unsubscribe();
  }, []);

  async function handlePin(thread) {
    const threadRef = doc(db, "threads", thread.id);
    await updateDoc(threadRef, {
      pinned: !thread.pinned,
    });
  }

  useEffect(() => {
    if (activeTab === "general") {
      setRoomMembers([]);
      return;
    }
    const currentRoom = rooms.find((r) => r.id === activeTab);
    if (!currentRoom?.members?.length) return;

    async function fetchMembers() {
      const snapshot = await getDocs(collection(db, "users"));
      const allUsers = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      const members = allUsers.filter((u) =>
        currentRoom.members.includes(u.id),
      );
      setRoomMembers(members);
    }
    fetchMembers();
  }, [activeTab, rooms]);

  async function handleDeleteThread(threadId) {
    if (window.confirm("Are you sure you want to delete this thread?")) {
      await deleteDoc(doc(db, "threads", threadId));
    }
  }

  async function handleDeleteRoom(roomId) {
    if (
      window.confirm(
        "Are you sure you want to delete this room? All threads and replies inside will be permanently deleted.",
      )
    ) {
      try {
        const threadsSnapshot = await getDocs(
          query(collection(db, "threads"), where("roomId", "==", roomId)),
        );

        await Promise.all(
          threadsSnapshot.docs.map(async (threadDoc) => {
            const repliesSnapshot = await getDocs(
              collection(db, "threads", threadDoc.id, "replies"),
            );
            await Promise.all(
              repliesSnapshot.docs.map((replyDoc) =>
                deleteDoc(
                  doc(db, "threads", threadDoc.id, "replies", replyDoc.id),
                ),
              ),
            );
            await deleteDoc(doc(db, "threads", threadDoc.id));
          }),
        );

        await deleteDoc(doc(db, "rooms", roomId));
        setActiveTab("general");
      } catch (err) {
        console.error("Error deleting room:", err);
      }
    }
  }

  async function handleLeaveRoom(room) {
    if (window.confirm(`Leave ${room.name}?`)) {
      await updateDoc(doc(db, "rooms", room.id), {
        members: room.members.filter((id) => id !== user.uid),
      });
      setActiveTab("general");
    }
  }

  async function handleRoomClick(room) {
    if (room.members?.includes(user.uid)) {
      setActiveTab(room.id);
      return;
    }
    setPendingRoom(room);
  }

  async function handleJoinRoom() {
    if (pendingRoom.isPasswordProtected) {
      if (passwordInput !== pendingRoom.password) {
        setPasswordError("Incorrect password. Please try again.");
        return;
      }
    }
    try {
      await updateDoc(doc(db, "rooms", pendingRoom.id), {
        members: [...pendingRoom.members, user.uid],
      });
      setActiveTab(pendingRoom.id);
      setPendingRoom(null);
      setPasswordInput("");
      setPasswordError("");
    } catch (err) {
      setPasswordError(err.message);
    }
  }

  if (showCreate) {
    return (
      <CreateThread
        userProfile={userProfile}
        user={user}
        onBack={() => setShowCreate(false)}
        roomId={activeTab === "general" ? null : activeTab}
        rooms={rooms}
      />
    );
  }

  const filteredThreads = threads
    .filter((thread) => {
      if (filter === "pinned") return thread.pinned;
      if (filter === "student") return thread.authorRole === "student";
      if (filter === "lecturer") return thread.authorRole === "lecturer";
      return true;
    })
    .filter((thread) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        thread.title.toLowerCase().includes(query) ||
        thread.body.toLowerCase().includes(query)
      );
    });

  return (
    <div className="min-h-screen bg-[#0f1117] flex flex-col">
      <nav className="bg-[#1a1d27] border-b border-[#2a2d3a] px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold tracking-widest uppercase bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
          🎓 AJU Forum
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-600 text-sm">
            {userProfile.displayName}{" "}
            <span className="text-[#8b92a5] text-sm">
              {userProfile.displayName}{" "}
              <span
                className={`font-bold ${
                  userProfile.role === "lecturer"
                    ? "text-emerald-400"
                    : userProfile.role === "admin"
                      ? "text-purple-400"
                      : userProfile.role === "manager"
                        ? "text-amber-400"
                        : "text-blue-400"
                }`}
              >
                ({userProfile.role})
              </span>
            </span>
          </span>
          <NotificationBell user={user} />
          {userProfile.role === "admin" && (
            <button
              onClick={() => navigate("/admin")}
              className="bg-purple-600 text-white text-sm font-bold py-2 px-4 rounded-lg hover:bg-purple-700"
            >
              ⚙️ Admin
            </button>
          )}
          <button
            onClick={() => auth.signOut()}
            className="bg-red-500 text-white text-sm font-bold py-2 px-4 rounded-lg hover:bg-red-600"
          >
            Log Out
          </button>
        </div>
      </nav>

      <div className="flex flex-row flex-1 overflow-hidden">
        {/* Left sidebar — rooms list */}
        <div className="w-64 flex-shrink-0 min-h-full bg-[#1a1d27] border-r border-[#2a2d3a] p-4">
          <h3 className="font-bold text-[#8b92a5] mb-3 text-xs uppercase tracking-widest">
            💬 Spaces
          </h3>

          {/* General tab */}
          <div
            onClick={() => setActiveTab("general")}
            className={`flex items-center gap-2 p-3 rounded-xl cursor-pointer mb-2 transition-colors duration-200
  ${activeTab === "general" ? "bg-blue-600 text-white" : "hover:bg-[#2a2d3a] text-[#8b92a5]"}`}
          >
            <span>📢</span>
            <span className="font-bold text-sm">General</span>
          </div>

          {/* Room tabs */}
          {rooms.map((room) => (
            <div
              key={room.id}
              onClick={() => handleRoomClick(room)}
              className={`flex items-center gap-2 p-3 rounded-xl cursor-pointer mb-2 transition-colors duration-200
  ${activeTab === room.id ? "bg-blue-600 text-white" : "hover:bg-[#2a2d3a] text-[#8b92a5]"}`}
            >
              <span>{room.isPasswordProtected ? "🔒" : "🔓"}</span>
              <span className="font-bold text-sm line-clamp-1">
                {room.name}
              </span>
            </div>
          ))}

          {/* Create room button */}
          {(userProfile.role === "admin" ||
            userProfile.role === "lecturer" ||
            userProfile.role === "manager") && (
            <button
              onClick={() => navigate("/create-room")}
              className="w-full mt-2 border-2 border-dashed border-blue-800 text-blue-400 font-bold py-2 rounded-xl hover:bg-blue-900/20 transition-colors duration-200 text-sm"
            >
              + Create Room
            </button>
          )}

          {activeTab !== "general" && roomMembers.length > 0 && (
            <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-4 mt-4">
              <h3 className="font-bold text-[#8b92a5] mb-3 text-xs uppercase tracking-widest">
                👥 Members
              </h3>
              <div className="flex flex-col gap-2">
                {roomMembers.map((member) => (
                  <div key={member.id} className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-900/40 flex items-center justify-center text-xs font-bold text-blue-400">
                      {member.displayName?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#e2e8f0]">
                        {member.displayName}
                      </p>
                      <p
                        className={`text-xs ${
                          member.role === "lecturer"
                            ? "text-green-500"
                            : member.role === "manager"
                              ? "text-orange-500"
                              : member.role === "admin"
                                ? "text-purple-500"
                                : "text-gray-400"
                        }`}
                      >
                        {member.role}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right content — threads */}
        <div className="flex-1 px-6 py-8 overflow-y-auto bg-[#0f1117]">
          <div className="flex justify-between items-center mb-4">
            <div className="flex flex-col mb-2">
              <h2 className="text-2xl font-bold text-[#e2e8f0]">
                {activeTab === "general"
                  ? "📢 General"
                  : rooms.find((r) => r.id === activeTab)?.name || "Room"}
              </h2>
              {activeTab !== "general" &&
                (() => {
                  const currentRoom = rooms.find((r) => r.id === activeTab);
                  return currentRoom ? (
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-sm text-[#8b92a5]">
                        {currentRoom.members?.length || 0} member
                        {currentRoom.members?.length !== 1 ? "s" : ""}
                      </p>
                      {(userProfile.role === "admin" ||
                        currentRoom.createdBy === user.uid) && (
                        <button
                          onClick={() => handleDeleteRoom(currentRoom.id)}
                          className="text-xs font-bold py-1 px-3 rounded-full border-2 border-red-400 text-red-400 hover:bg-red-50 transition-colors duration-200"
                        >
                          🗑️ Delete Room
                        </button>
                      )}
                      {currentRoom.createdBy !== user.uid &&
                        currentRoom.members?.includes(user.uid) && (
                          <button
                            onClick={() => handleLeaveRoom(currentRoom)}
                            className="text-xs font-bold py-1 px-3 rounded-full border-2 border-gray-400 text-gray-400 hover:bg-gray-50 transition-colors duration-200"
                          >
                            🚪 Leave Room
                          </button>
                        )}
                    </div>
                  ) : null;
                })()}
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700"
            >
              + New Thread
            </button>
          </div>

          <input
            type="text"
            placeholder="Search threads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-[#2a2d3a] rounded-lg p-3 mb-4 outline-none focus:border-blue-500 bg-[#1a1d27] text-[#e2e8f0]"
          />

          <div className="flex gap-2 mb-6 flex-wrap">
            {["all", "pinned", "student", "lecturer"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`py-1 px-4 rounded-full text-sm font-bold border-2 transition-colors duration-200
  ${
    filter === f
      ? "bg-blue-600 text-white border-blue-600"
      : "bg-transparent text-blue-400 border-blue-800 hover:bg-blue-900/20"
  }
`}
              >
                {f === "all"
                  ? "All"
                  : f === "pinned"
                    ? "📌 Pinned"
                    : f === "student"
                      ? "🎓 Students"
                      : "👨‍🏫 Lecturers"}
              </button>
            ))}
          </div>

          {filteredThreads.length === 0 ? (
            <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-6 text-center text-[#4a5066]">
              {searchQuery || filter !== "all"
                ? "No threads match your search or filter."
                : "No threads yet. Be the first to post!"}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filteredThreads.map((thread) => (
                <div
                  key={thread.id}
                  className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-6 hover:border-blue-800 transition-colors duration-200"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3
                      onClick={() => navigate(`/thread/${thread.id}`)}
                      className="text-lg font-bold text-[#e2e8f0] cursor-pointer hover:text-blue-400 transition-colors duration-200"
                    >
                      {thread.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      {thread.pinned && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 font-bold px-2 py-1 rounded-full">
                          📌 Pinned
                        </span>
                      )}
                      {userProfile.role === "lecturer" ||
                      userProfile.role === "admin" ||
                      (userProfile.role === "manager" &&
                        rooms.find((r) => r.id === activeTab)?.createdBy ===
                          user.uid) ? (
                        <button
                          onClick={() => handlePin(thread)}
                          className={`text-xs font-bold py-1 px-3 rounded-full border-2 transition-colors duration-200
                      ${
                        thread.pinned
                          ? "bg-yellow-400 text-white border-yellow-400 hover:bg-yellow-500"
                          : "bg-white text-yellow-500 border-yellow-400 hover:bg-yellow-50"
                      }
                    `}
                        >
                          {thread.pinned ? "Unpin" : "Pin"}
                        </button>
                      ) : null}
                      {(userProfile.role === "lecturer" ||
                        userProfile.role === "admin" ||
                        thread.authorId === user.uid ||
                        (userProfile.role === "manager" &&
                          rooms.find((r) => r.id === activeTab)?.createdBy ===
                            user.uid)) && (
                        <button
                          onClick={() => handleDeleteThread(thread.id)}
                          className="text-xs font-bold py-1 px-3 rounded-full border-2 border-red-400 text-red-400 hover:bg-red-50 transition-colors duration-200"
                        >
                          🗑️ Delete
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-[#8b92a5] text-sm mb-3 line-clamp-2">
                    {thread.body}
                  </p>
                  {thread.attachment && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-500 mb-3">
                      {thread.attachment.type === "image"
                        ? "🖼️ Image attached"
                        : "📄 PDF attached"}
                    </span>
                  )}
                  <div className="flex justify-between items-center text-xs text-[#4a5066]">
                    <span>
                      Posted by{" "}
                      <span
                        className={`font-bold ${
                          thread.authorRole === "lecturer"
                            ? "text-emerald-400"
                            : thread.authorRole === "admin"
                              ? "text-purple-400"
                              : thread.authorRole === "manager"
                                ? "text-amber-400"
                                : "text-blue-400"
                        }`}
                      >
                        {thread.authorName}
                      </span>
                    </span>
                    <span className="text-[#4a5066]">
                      {thread.createdAt?.toDate().toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer user={user} userProfile={userProfile} />

      {pendingRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm mx-4">
            <h2 className="text-xl font-bold text-blue-700 mb-2">
              {pendingRoom.isPasswordProtected ? "🔒" : "🔓"} {pendingRoom.name}
            </h2>
            <p className="text-gray-500 text-sm mb-4">
              {pendingRoom.isPasswordProtected
                ? "This room is password protected. Enter the password to join."
                : "Would you like to join this room?"}
            </p>
            {pendingRoom.description && (
              <p className="text-gray-600 text-sm bg-gray-50 rounded-lg p-3 mb-4">
                {pendingRoom.description}
              </p>
            )}
            {passwordError && (
              <p className="text-red-500 text-sm mb-3">{passwordError}</p>
            )}
            {pendingRoom.isPasswordProtected && (
              <input
                type="password"
                placeholder="Enter room password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 mb-4 outline-none focus:border-blue-500"
              />
            )}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setPendingRoom(null);
                  setPasswordInput("");
                  setPasswordError("");
                }}
                className="flex-1 border-2 border-gray-300 text-gray-500 font-bold py-2 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleJoinRoom}
                className="flex-1 bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700"
              >
                Join Room
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
