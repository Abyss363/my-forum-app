import { useState, useEffect, useRef } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

function NotificationBell({ user }) {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setNotifications(list);
    });
    return () => unsubscribe();
  }, [user.uid]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleNotificationClick(notification) {
    await updateDoc(doc(db, "notifications", notification.id), { read: true });
    setShowDropdown(false);
    if (notification.threadId) {
      navigate(`/thread/${notification.threadId}`);
    }
  }

  async function markAllRead() {
    const unread = notifications.filter((n) => !n.read);
    await Promise.all(
      unread.map((n) =>
        updateDoc(doc(db, "notifications", n.id), { read: true }),
      ),
    );
  }

  async function clearAll() {
    const batch = writeBatch(db);
    notifications.forEach((n) => batch.delete(doc(db, "notifications", n.id)));
    await batch.commit();
    setShowDropdown(false);
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-[#8b92a5] hover:text-blue-400 transition-colors duration-200"
      >
        <span className="text-2xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-rose-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl shadow-lg z-50 overflow-hidden">
          <div className="flex justify-between items-center px-4 py-3 border-b border-[#2a2d3a]">
            <h3 className="font-bold text-[#e2e8f0]">Notifications</h3>
            <div className="flex gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-blue-400 hover:underline font-bold"
                >
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-xs text-rose-400 hover:underline font-bold"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-[#4a5066] text-sm text-center py-6">
                No notifications yet!
              </p>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`px-4 py-3 cursor-pointer border-b border-[#2a2d3a] transition-colors duration-200
                    ${
                      !notification.read
                        ? "bg-blue-900/20 hover:bg-blue-900/30"
                        : "hover:bg-[#0f1117]"
                    }`}
                >
                  <p className="text-sm text-[#e2e8f0]">
                    {notification.message}
                  </p>
                  <p className="text-xs text-[#4a5066] mt-1">
                    {notification.createdAt
                      ?.toDate()
                      .toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
