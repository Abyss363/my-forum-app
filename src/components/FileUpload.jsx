import { useState } from "react";

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = "aju_forum_uploads";

function FileUpload({ onUploadComplete }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isPDF = file.type === "application/pdf";

    if (!isImage && !isPDF) {
      setError("Only images and PDFs are allowed.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File must be under 10MB.");
      return;
    }

    setError("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
        { method: "POST", body: formData },
      );

      const data = await response.json();

      if (data.secure_url) {
        onUploadComplete({
          url: data.secure_url,
          type: isImage ? "image" : "pdf",
          name: file.name,
          publicId: data.public_id,
        });
      } else {
        setError("Upload failed. Please try again.");
      }
    } catch (err) {
      setError("Upload failed. Please try again.");
    }

    setUploading(false);
  }

  return (
    <div className="mb-4">
      <label className="block text-sm font-bold text-gray-600 mb-2">
        Attach a File (Image or PDF, max 10MB)
      </label>
      <input
        type="file"
        accept="image/*,.pdf"
        onChange={handleFileChange}
        disabled={uploading}
        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-bold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 cursor-pointer"
      />
      {uploading && <p className="text-blue-500 text-sm mt-2">Uploading...</p>}
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
}

export default FileUpload;
