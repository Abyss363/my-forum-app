import { useState } from "react";
import ReportModal from "./ReportModal";

function Footer({ user, userProfile }) {
  const [showReport, setShowReport] = useState(false);

  return (
    <>
      <footer className="bg-[#1a1d27] border-t border-[#2a2d3a] mt-12 py-8 px-6">
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-3 text-center">
          <h3 className="font-bold text-lg tracking-widest uppercase bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
            🎓 Arthur Jarvis University
          </h3>
          <p className="text-[#8b92a5] text-sm">
            AJU Forum — Student & Lecturer Discussion Platform
          </p>
          <div className="flex flex-col items-center gap-1 text-sm text-[#4a5066]">
            <span>
              Developed by{" "}
              <span className="font-bold text-[#8b92a5]">Sage</span>
            </span>

            <a
              href="mailto:ajuforum.support@gmail.com"
              className="text-blue-400 hover:text-blue-300 hover:underline transition-colors duration-200"
            >
              ajuforum.support@gmail.com
            </a>
          </div>
          <button
            onClick={() => setShowReport(true)}
            className="mt-2 border-2 border-blue-800 text-blue-400 font-bold py-2 px-6 rounded-full hover:bg-blue-900/20 transition-colors duration-200"
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
  );
}

export default Footer;
