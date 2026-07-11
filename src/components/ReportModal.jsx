import { useState } from "react";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";

function ReportModal({ user, userProfile, onClose }) {
  const [issue, setIssue] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit() {
    if (!issue.trim()) {
      setError("Please describe the issue.");
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, "reports"), {
        issue: issue,
        reporterName: userProfile.displayName,
        reporterEmail: user.email,
        reporterRole: userProfile.role,
        status: "open",
        createdAt: serverTimestamp(),
      });

      const adminsSnapshot = await getDocs(
        query(collection(db, "users"), where("role", "==", "admin")),
      );
      await Promise.all(
        adminsSnapshot.docs.map((adminDoc) =>
          addDoc(collection(db, "notifications"), {
            userId: adminDoc.id,
            message: `🐛 ${userProfile.displayName} submitted a bug report: "${issue.slice(0, 60)}${issue.length > 60 ? "..." : ""}"`,
            threadId: null,
            read: false,
            createdAt: serverTimestamp(),
          }),
        ),
      );

      setSuccess(true);
      setIssue("");
      setError("");
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl shadow-lg p-8 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
            🐛 Report an Issue
          </h2>
          <button
            onClick={onClose}
            className="text-[#4a5066] hover:text-[#8b92a5] text-2xl font-bold transition-colors duration-200"
          >
            ✕
          </button>
        </div>

        {success ? (
          <div className="text-center py-6">
            <p className="text-4xl mb-4">✅</p>
            <p className="text-[#e2e8f0] font-bold text-lg mb-2">
              Report Submitted!
            </p>
            <p className="text-[#8b92a5] text-sm mb-6">
              Thank you for helping improve the platform.
            </p>
            <button
              onClick={onClose}
              className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-3 mb-4 text-sm text-[#8b92a5]">
              Submitting as{" "}
              <span className="font-bold text-blue-400">
                {userProfile.displayName}
              </span>{" "}
              ({user.email})
            </div>

            {error && <p className="text-rose-400 text-sm mb-4">{error}</p>}

            <textarea
              placeholder="Describe the issue you encountered..."
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              rows={5}
              className="w-full border border-[#2a2d3a] rounded-lg p-3 mb-4 outline-none focus:border-blue-500 resize-none bg-[#0f1117] text-[#e2e8f0]"
            />

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 border-2 border-[#2a2d3a] text-[#8b92a5] font-bold py-2 rounded-lg hover:bg-[#0f1117] transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200"
              >
                {loading ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ReportModal;
