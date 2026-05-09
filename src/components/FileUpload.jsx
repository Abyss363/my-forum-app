import { useState } from "react";

function FileUpload({ onFileSelected }) {
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  function handleFileChange(e) {
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
    setSelectedFile(file);
    onFileSelected(file);

    if (isImage) {
      const reader = new FileReader();
      reader.onload = (e) =>
        setPreview({ type: "image", url: e.target.result });
      reader.readAsDataURL(file);
    } else {
      setPreview({ type: "pdf", name: file.name });
    }
  }

  function handleClear() {
    setSelectedFile(null);
    setPreview(null);
    setError("");
    onFileSelected(null);
  }

  return (
    <div className="mb-4">
      <label className="block text-sm font-bold text-gray-600 mb-2">
        Attach a File (Image or PDF, max 10MB)
      </label>

      {!selectedFile ? (
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={handleFileChange}
          className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-bold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 cursor-pointer"
        />
      ) : (
        <div className="border border-gray-200 rounded-lg p-3">
          {preview?.type === "image" && (
            <img
              src={preview.url}
              alt="Preview"
              className="max-h-48 rounded-lg object-contain mb-2"
            />
          )}
          {preview?.type === "pdf" && (
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <span className="text-2xl">📄</span>
              <span className="text-sm font-bold">{preview.name}</span>
            </div>
          )}
          <button
            onClick={handleClear}
            className="text-red-500 text-sm hover:underline"
          >
            ✕ Remove file
          </button>
        </div>
      )}

      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
}

export default FileUpload;
