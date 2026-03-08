import { useState } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

function ReportModal({ user, userProfile, onClose }) {
  const [issue, setIssue] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit() {
    if (!issue.trim()) {
      setError('Please describe the issue.')
      return
    }
    setLoading(true)
    try {
      await addDoc(collection(db, 'reports'), {
        issue: issue,
        reporterName: userProfile.displayName,
        reporterEmail: user.email,
        reporterRole: userProfile.role,
        status: 'open',
        createdAt: serverTimestamp(),
      })
      setSuccess(true)
      setIssue('')
      setError('')
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-blue-700">🐛 Report an Issue</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ✕
          </button>
        </div>

        {success ? (
          <div className="text-center py-6">
            <p className="text-4xl mb-4">✅</p>
            <p className="text-gray-700 font-bold text-lg mb-2">Report Submitted!</p>
            <p className="text-gray-400 text-sm mb-6">
              Thank you for helping improve the platform.
            </p>
            <button
              onClick={onClose}
              className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="bg-blue-50 rounded-lg p-3 mb-4 text-sm text-gray-600">
              Submitting as <span className="font-bold text-blue-700">{userProfile.displayName}</span>
              {' '}({user.email})
            </div>

            {error && (
              <p className="text-red-500 text-sm mb-4">{error}</p>
            )}

            <textarea
              placeholder="Describe the issue you encountered..."
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              rows={5}
              className="w-full border border-gray-300 rounded-lg p-3 mb-4 outline-none focus:border-blue-500 resize-none"
            />

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 border-2 border-gray-300 text-gray-500 font-bold py-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200"
              >
                {loading ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ReportModal