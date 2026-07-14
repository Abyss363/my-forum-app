import { useState, useEffect } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

function AdminDashboard({ userProfile }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchUsers() {
      const snapshot = await getDocs(collection(db, "users"));
      const userList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(userList);
      setLoading(false);
    }
    fetchUsers();
  }, []);

  async function handleRoleChange(userId, newRole) {
    if (window.confirm(`Change this user's role to ${newRole}?`)) {
      await updateDoc(doc(db, "users", userId), { role: newRole });
      setUsers(
        users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
      );
    }
  }

  if (userProfile.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
        <p className="text-rose-400 font-bold text-xl">Access Denied</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1117]">
      <nav className="bg-[#1a1d27] border-b border-[#2a2d3a] px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold tracking-widest uppercase bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
          🎓 AJU Forum
        </h1>
        <button
          onClick={() => navigate("/")}
          className="text-blue-400 font-bold hover:text-blue-300 transition-colors duration-200"
        >
          ← Back
        </button>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-[#e2e8f0] mb-6">
          ⚙️ Admin Dashboard
        </h2>

        {loading ? (
          <p className="text-blue-400 font-bold">Loading users...</p>
        ) : (
          <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="border-b border-[#2a2d3a]">
                <tr>
                  <th className="text-left p-4 text-xs font-bold text-[#8b92a5] uppercase tracking-widest">
                    Name
                  </th>
                  <th className="text-left p-4 text-xs font-bold text-[#8b92a5] uppercase tracking-widest">
                    Email
                  </th>
                  <th className="text-left p-4 text-xs font-bold text-[#8b92a5] uppercase tracking-widest">
                    Role
                  </th>
                  <th className="text-left p-4 text-xs font-bold text-[#8b92a5] uppercase tracking-widest">
                    Change Role
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-[#2a2d3a] hover:bg-[#0f1117] transition-colors duration-200"
                  >
                    <td className="p-4 text-sm font-bold text-[#e2e8f0]">
                      {user.displayName}
                    </td>
                    <td className="p-4 text-sm text-[#8b92a5]">{user.email}</td>
                    <td className="p-4">
                      <span
                        className={`text-xs font-bold py-1 px-3 rounded-full
                        ${
                          user.role === "admin"
                            ? "bg-purple-900/40 text-purple-400"
                            : user.role === "lecturer"
                              ? "bg-emerald-900/40 text-emerald-400"
                              : user.role === "manager"
                                ? "bg-amber-900/40 text-amber-400"
                                : "bg-blue-900/40 text-blue-400"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2 flex-wrap">
                        {user.role !== "student" && (
                          <button
                            onClick={() => handleRoleChange(user.id, "student")}
                            className="text-xs font-bold py-1 px-3 rounded-full border-2 border-blue-800 text-blue-400 hover:bg-blue-900/20 transition-colors duration-200"
                          >
                            Make Student
                          </button>
                        )}
                        {user.role !== "lecturer" && (
                          <button
                            onClick={() =>
                              handleRoleChange(user.id, "lecturer")
                            }
                            className="text-xs font-bold py-1 px-3 rounded-full border-2 border-emerald-800 text-emerald-400 hover:bg-emerald-900/20 transition-colors duration-200"
                          >
                            Make Lecturer
                          </button>
                        )}
                        {user.role !== "manager" && (
                          <button
                            onClick={() => handleRoleChange(user.id, "manager")}
                            className="text-xs font-bold py-1 px-3 rounded-full border-2 border-amber-800 text-amber-400 hover:bg-amber-900/20 transition-colors duration-200"
                          >
                            Make Manager
                          </button>
                        )}
                        {user.role !== "admin" && (
                          <button
                            onClick={() => handleRoleChange(user.id, "admin")}
                            className="text-xs font-bold py-1 px-3 rounded-full border-2 border-purple-800 text-purple-400 hover:bg-purple-900/20 transition-colors duration-200"
                          >
                            Make Admin
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
