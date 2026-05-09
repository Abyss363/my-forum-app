import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import FileUpload from "../components/FileUpload";

function CreateThread({ userProfile, user, onBack }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState(null);
  const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const UPLOAD_PRESET = "aju_forum_uploads";

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

      await addDoc(collection(db, "threads"), {
        title: title,
        body: body,
        authorName: userProfile.displayName,
        authorRole: userProfile.role,
        authorId: user.uid,
        createdAt: serverTimestamp(),
        pinned: false,
        attachment: attachment,
      });
      onBack();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-blue-50">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-700"> 🎓 AJUFORUM </h1>
        <button
          onClick={onBack}
          className="text-blue-600 font-bold hover:underline"
        >
          ← Back
        </button>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-700 mb-6">
          Create New Thread
        </h2>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <div className="bg-white rounded-2xl shadow p-6">
          <input
            type="text"
            placeholder="Thread Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 mb-4 outline-none focus:border-blue-500"
          />

          <textarea
            placeholder="Write your post here..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            className="w-full border border-gray-300 rounded-lg p-3 mb-6 outline-none focus:border-blue-500 resize-none"
          />
          <FileUpload onFileSelected={(file) => setAttachmentFile(file)} />

          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Posting..." : "Post Thread"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateThread;
