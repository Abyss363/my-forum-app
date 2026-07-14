import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  arrayUnion,
  arrayRemove,
  deleteDoc,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";
import Footer from "../components/Footer";
import ThreadSearch from "../components/ThreadSearch";
import createNotification from "../components/createNotification";

function ThreadPage({ userProfile, user }) {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replies, setReplies] = useState([]);
  const [replyBody, setReplyBody] = useState("");
  const [replyError, setReplyError] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [showThreadSearch, setShowThreadSearch] = useState(false);
  const [referencedThread, setReferencedThread] = useState(null);
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    async function fetchThread() {
      const docRef = doc(db, "threads", threadId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const threadData = { id: docSnap.id, ...docSnap.data() };

        if (threadData.roomId) {
          const roomRef = doc(db, "rooms", threadData.roomId);
          const roomSnap = await getDoc(roomRef);
          if (roomSnap.exists()) {
            const roomData = roomSnap.data();
            if (!roomData.members?.includes(user.uid)) {
              navigate("/");
              return;
            }
          }
        }
        setThread(threadData);
      }
      setLoading(false);
    }
    fetchThread();
  }, [threadId]);

  useEffect(() => {
    const q = query(
      collection(db, "threads", threadId, "replies"),
      orderBy("createdAt", "asc"),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const replyList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setReplies(replyList);
    });
    return () => unsubscribe();
  }, [threadId]);

  useEffect(() => {
    async function fetchRooms() {
      const snapshot = await getDocs(collection(db, "rooms"));
      const roomList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRooms(roomList);
    }
    fetchRooms();
  }, []);

  async function handleReply() {
    if (!replyBody.trim()) {
      setReplyError("Reply cannot be empty.");
      return;
    }
    setReplyLoading(true);
    try {
      await addDoc(collection(db, "threads", threadId, "replies"), {
        body: replyBody,
        authorName: userProfile.displayName,
        authorRole: userProfile.role,
        authorId: user.uid,
        createdAt: serverTimestamp(),
        upvotes: 0,
        referencedThread: referencedThread,
      });
      if (thread.authorId !== user.uid) {
        await createNotification({
          userId: thread.authorId,
          message: `${userProfile.displayName} replied to your thread "${thread.title}"`,
          threadId: threadId,
        });
      }
      setReplyBody("");
      setReplyError("");
      setReferencedThread(null);
    } catch (err) {
      setReplyError(err.message);
    }
    setReplyLoading(false);
  }

  async function handleUpvote(reply) {
    if (reply.authorId === user.uid) return;

    const replyRef = doc(db, "threads", threadId, "replies", reply.id);
    const alreadyUpvoted = reply.upvotedBy?.includes(user.uid);

    await updateDoc(replyRef, {
      upvotedBy: alreadyUpvoted ? arrayRemove(user.uid) : arrayUnion(user.uid),
    });
  }

  async function handleDeleteReply(replyId) {
    if (window.confirm("Are you sure you want to delete this reply?")) {
      await deleteDoc(doc(db, "threads", threadId, "replies", replyId));
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <p className="text-blue-600 text-xl font-bold">Loading...</p>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <p className="text-red-500 text-xl font-bold">Thread not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1117] flex flex-col">
      <nav className="bg-[#1a1d27] border-b border-[#2a2d3a] px-6 py-4 flex justify-between items-center gap-4 overflow-x-auto">
        <h1 className="text-xl font-bold tracking-widest uppercase bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
          🎓 AJU Forum
        </h1>
        <button
          onClick={() => navigate("/")}
          className="text-blue-400 font-bold hover:text-blue-300 transition-colors duration-200"
        >
          🔙 Back
        </button>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8 flex-1 w-full">
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-[#e2e8f0]">
              {thread.title}
            </h2>
            {thread.pinned && (
              <span className="text-xs bg-yellow-100 text-yellow-700 font-bold px-2 py-1 rounded-full">
                📌 Pinned
              </span>
            )}
          </div>
          <p className="text-[#8b92a5] mb-6 leading-relaxed">{thread.body}</p>
          {thread.attachment && (
            <div className="mb-6">
              {thread.attachment.type === "image" ? (
                <img
                  src={thread.attachment.url}
                  alt="Thread attachment"
                  className="max-w-full rounded-xl object-contain max-h-96"
                />
              ) : (
                <a
                  href={thread.attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-[#0f1117] border border-[#2a2d3a] rounded-xl p-4 hover:border-blue-800 transition-colors duration-200"
                >
                  <span className="text-4xl">📄</span>
                  <div>
                    <p className="font-bold text-[#e2e8f0]">
                      {thread.attachment.name}
                    </p>
                    <p className="text-sm text-blue-500">Click to open PDF</p>
                  </div>
                </a>
              )}
            </div>
          )}
          {thread.referencedThread && (
            <div
              onClick={() => navigate(`/thread/${thread.referencedThread.id}`)}
              className="flex items-center gap-2 bg-blue-900/20 border border-blue-800 rounded-lg p-3 mb-4 cursor-pointer hover:bg-blue-900/30 transition-colors duration-200"
            >
              <span className="text-blue-500 font-bold text-sm">
                📎 Related Thread:
              </span>
              <span className="text-blue-700 text-sm font-bold line-clamp-1">
                {thread.referencedThread.title}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center text-xs text-[#4a5066] border-t border-[#2a2d3a] pt-4">
            <span>
              Posted by{" "}
              <span
                className={`font-bold ${
                  thread.authorRole === "lecturer"
                    ? "text-emerald-400"
                    : thread.authorRole === "admin"
                      ? "text-purple-400"
                      : "text-blue-400"
                }`}
              >
                {thread.authorName}
              </span>
              {thread.authorRole === "lecturer" && "🎓"}
            </span>
            <span>
              {thread.createdAt?.toDate().toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-bold text-[#e2e8f0]">
            {replies.length} {replies.length === 1 ? "Reply" : "Replies"}
          </h3>

          {replies.length === 0 ? (
            <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-6 text-center text-[#4a5066]">
              No replies yet. Be the first to reply!
            </div>
          ) : (
            replies.map((reply) => (
              <div
                key={reply.id}
                className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-6 relative"
              >
                <p className="text-[#8b92a5] mb-4 leading-relaxed">
                  {reply.body}
                </p>
                {reply.referencedThread && (
                  <div
                    onClick={() =>
                      navigate(`/thread/${reply.referencedThread.id}`)
                    }
                    className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3 cursor-pointer hover:bg-blue-100 transition-colors duration-200"
                  >
                    <span className="text-blue-500 font-bold text-sm">
                      📎 Related Thread:
                    </span>
                    <span className="text-blue-700 text-sm font-bold line-clamp-1">
                      {reply.referencedThread.title}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => handleUpvote(reply)}
                  disabled={reply.authorId === user.uid}
                  className={`flex items-center gap-2 text-sm font-bold py-1 px-4 rounded-full transition-colors duration-200
  ${
    reply.upvotedBy?.includes(user.uid)
      ? "bg-blue-600 text-white hover:bg-blue-700"
      : "bg-transparent text-blue-400 border-2 border-blue-800 hover:bg-blue-900/20"
  }
  ${
    reply.authorId === user.uid
      ? "opacity-40 cursor-not-allowed"
      : "cursor-pointer"
  }`}
                >
                  👍 <span>{reply.upvotedBy?.length || 0}</span>
                </button>
                <div className="flex justify-between items-center text-xs text-[#4a5066] border-t border-[#2a2d3a] pt-3 mt-3 gap-2 flex-wrap">
                  <span>
                    <span
                      className={`font-bold ${
                        reply.authorRole === "lecturer"
                          ? "text-emerald-400"
                          : reply.authorRole === "admin"
                            ? "text-purple-400"
                            : reply.authorRole === "manager"
                              ? "text-amber-400"
                              : "text-blue-400"
                      }`}
                    >
                      {reply.authorName}
                    </span>
                    {reply.authorRole === "lecturer" && "👨‍🏫"}
                  </span>
                  <span>
                    {reply.createdAt?.toDate().toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>

                  {(userProfile.role === "lecturer" ||
                    reply.authorId === user.uid) && (
                    <button
                      onClick={() => handleDeleteReply(reply.id)}
                      className="text-xs font-bold py-1 px-3 rounded-full border-2 border-red-400 text-red-400 hover:bg-red-50 transition-colors duration-200"
                    >
                      🗑️ Delete
                    </button>
                  )}
                </div>
              </div>
            ))
          )}

          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-6">
            <h4 className="text-md font-bold text-[#e2e8f0] mb-3">
              Post a Reply Post a Reply
            </h4>
            {replyError && (
              <p className="text-red-500 text-sm mb-3">{replyError}</p>
            )}

            <textarea
              placeholder="Write your reply here..."
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              rows={4}
              className="w-full border border-[#2a2d3a] rounded-lg p-3 mb-3 outline-none focus:border-blue-500 resize-none bg-[#0f1117] text-[#e2e8f0]"
            />

            {!showThreadSearch && (
              <button
                onClick={() => setShowThreadSearch(true)}
                className="w-full border-2 border-dashed border-blue-800 text-blue-400 font-bold py-2 rounded-lg hover:bg-blue-900/20 transition-colors duration-200 mb-3"
              >
                📎 Reference a Thread
              </button>
            )}

            {showThreadSearch && (
              <ThreadSearch
                onSelect={(thread) => {
                  setReferencedThread(thread);
                  setShowThreadSearch(false);
                }}
                onClose={() => setShowThreadSearch(false)}
                user={user}
                rooms={rooms}
              />
            )}

            {referencedThread && (
              <div className="flex items-center justify-between bg-blue-900/20 border border-blue-800 rounded-lg p-3 mb-3">
                <span className="text-sm text-blue-300 font-bold line-clamp-1">
                  📎 {referencedThread.title}
                </span>
                <button
                  onClick={() => setReferencedThread(null)}
                  className="text-gray-400 hover:text-red-400 font-bold ml-2"
                >
                  ✕
                </button>
              </div>
            )}

            <button
              onClick={handleReply}
              disabled={replyLoading}
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {replyLoading ? "Posting..." : "Post Reply"}
            </button>
          </div>
        </div>
      </div>
      <Footer user={user} userProfile={userProfile} />
    </div>
  );
}

export default ThreadPage;
