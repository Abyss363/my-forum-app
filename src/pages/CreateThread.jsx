import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import FileUpload from "../components/FileUpload";
import ThreadSearch from "../components/ThreadSearch";
import createNotification from "../components/createNotification";

function CreateThread({ userProfile, user, onBack, roomId, rooms }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState(null);
  const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const UPLOAD_PRESET = "aju_forum_uploads";
  const [showThreadSearch, setShowThreadSearch] = useState(false);
  const [referencedThread, setReferencedThread] = useState(null);

  async function uploadToCloudinary(file) {
    const isImage = file.type.startsWith("image/");
    const resourceType = "auto";
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
      { method: "POST", body: formData },
    );
    const data = await response.json();
    return {
      url: data.secure_url,
      type: isImage ? "image" : "pdf",
      name: file.name,
      publicId: data.public_id,
    };
  }

  async function handleCreate() {
    if (!title.trim() || !body.trim()) {
      setError("Please fill in both fields.");
      return;
    }
    setLoading(true);
    try {
      let attachment = null;
      if (attachmentFile) {
        attachment = await uploadToCloudinary(attachmentFile);
      }
      const threadRef = await addDoc(collection(db, "threads"), {
        title: title,
        body: body,
        authorName: userProfile.displayName,
        authorRole: userProfile.role,
        authorId: user.uid,
        createdAt: serverTimestamp(),
        pinned: false,
        attachment: attachment,
        roomId: roomId,
        referencedThread: referencedThread,
      });
      if (roomId) {
        const currentRoom = rooms.find((r) => r.id === roomId);
        if (currentRoom?.members) {
          const otherMembers = currentRoom.members.filter(
            (id) => id !== user.uid,
          );
          await Promise.all(
            otherMembers.map((memberId) =>
              createNotification({
                userId: memberId,
                message: `${userProfile.displayName} posted a new thread in ${currentRoom.name}: "${title}"`,
                threadId: threadRef.id,
              }),
            ),
          );
        }
      }
      onBack();
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
          onClick={onBack}
          className="text-blue-400 font-bold hover:text-blue-300 transition-colors duration-200"
        >
          ← Back
        </button>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-[#e2e8f0] mb-6">
          Create New Thread
        </h2>

        {error && <p className="text-rose-400 text-sm mb-4">{error}</p>}

        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-6">
          <input
            type="text"
            placeholder="Thread Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-[#2a2d3a] rounded-lg p-3 mb-4 outline-none focus:border-blue-500 bg-[#0f1117] text-[#e2e8f0]"
          />

          <textarea
            placeholder="Write your post here..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            className="w-full border border-[#2a2d3a] rounded-lg p-3 mb-6 outline-none focus:border-blue-500 resize-none bg-[#0f1117] text-[#e2e8f0]"
          />

          <FileUpload onFileSelected={(file) => setAttachmentFile(file)} />

          {!showThreadSearch && (
            <button
              onClick={() => setShowThreadSearch(true)}
              className="w-full border-2 border-dashed border-blue-800 text-blue-400 font-bold py-2 rounded-lg hover:bg-blue-900/20 transition-colors duration-200 mb-4"
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
            <div className="flex items-center justify-between bg-blue-900/20 border border-blue-800 rounded-lg p-3 mb-4">
              <span className="text-sm text-blue-300 font-bold line-clamp-1">
                📎 {referencedThread.title}
              </span>
              <button
                onClick={() => setReferencedThread(null)}
                className="text-[#4a5066] hover:text-rose-400 font-bold ml-2"
              >
                ✕
              </button>
            </div>
          )}

          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200"
          >
            {loading ? "Posting..." : "Post Thread"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateThread;
