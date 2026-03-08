import { useState } from 'react'
import ReportModal from './ReportModal'

function Footer({ user, userProfile }) {
  const [showReport, setShowReport] = useState(false)

  return (
    <>
      <footer className="bg-white border-t border-gray-200 mt-12 py-8 px-6">
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-3 text-center">
          <h3 className="text-blue-700 font-bold text-lg">🎓 Arthur Jarvis University</h3>
          <p className="text-gray-500 text-sm">UniForum — Student & Lecturer Discussion Platform</p>
          <div className="flex flex-col items-center gap-1 text-sm text-gray-400">
            <span>Developed by <span className="font-bold text-gray-600">Sage</span></span>
            <a
              href="mailto:ajuforum.support@gmail.com"
              className="text-blue-500 hover:underline"
            >
              ajuforum.support@gmail.com
            </a>
          </div>
          <button
            onClick={() => setShowReport(true)}
            className="mt-2 border-2 border-blue-600 text-blue-600 font-bold py-2 px-6 rounded-full hover:bg-blue-50 transition-colors duration-200"
          >
            🐛 Report an Issue
          </button>
        </div>
      </footer>

      {showReport && (
        <ReportModal
          user={user}
          userProfile={userProfile}
          onClose={() => setShowReport(false)}
        />
      )}
    </>
  )
}

export default Footer