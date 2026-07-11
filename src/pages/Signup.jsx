import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

function getFriendlyError(code) {
  switch (code) {
    case "auth/invalid-credential":
      return "Incorrect email or password. Please try again.";
    case "auth/user-not-found":
      return "No account found with this email.";
    case "auth/wrong-password":
      return "Incorrect password. Please try again.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please try again later.";
    case "auth/network-request-failed":
      return "Network error. Please check your connection.";
    case "auth/email-already-in-use":
      return "An account with this email already exists.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    default:
      return "Something went wrong. Please try again.";
  }
}

function Signup({ onSwitch }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState("student");
  const [lecturerCode, setLecturerCode] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showLecturerCode, setShowLecturerCode] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    if (role === "lecturer") {
      if (lecturerCode !== import.meta.env.VITE_LECTURER_CODE) {
        setError("Invalid lecturer code. Please contact your administrator.");
        return;
      }
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;
      await setDoc(doc(db, "users", user.uid), {
        email: email,
        displayName: displayName,
        role: role,
      });
    } catch (err) {
      setError(getFriendlyError(err.code));
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl shadow-lg p-10 w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center tracking-widest uppercase bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
          Welcome Back
        </h1>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <input
          type="text"
          placeholder="Display Name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-3 mb-4 outline-none focus:border-blue-500"
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-[#2a2d3a] rounded-lg p-3 mb-4 outline-none focus:border-blue-500 bg-[#0f1117] text-[#e2e8f0]"
        />

        <div className="relative mb-6">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-[#2a2d3a] rounded-lg p-3 outline-none focus:border-blue-500 bg-[#0f1117] text-[#e2e8f0]"
          />
          <span
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3 text-gray-400 cursor-pointer"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </span>
        </div>

        <div className="flex gap-4 mb-4">
          <button
            onClick={() => setRole("student")}
            className={`flex-1 py-2 rounded-lg font-bold border-2 transition-colors ${
              role === "student"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-transparent text-blue-400 border-blue-800 hover:bg-blue-900/20"
            }`}
          >
            Student
          </button>
          <button
            onClick={() => setRole("lecturer")}
            className={`flex-1 py-2 rounded-lg font-bold border-2 transition-colors ${
              role === "lecturer"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-transparent text-blue-400 border-blue-800 hover:bg-blue-900/20"
            }`}
          >
            Lecturer
          </button>
        </div>

        {role === "lecturer" && (
          <div className="relative mb-6">
            <input
              type={showLecturerCode ? "text" : "password"}
              placeholder="Lecturer Code"
              value={lecturerCode}
              onChange={(e) => setLecturerCode(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-blue-500"
            />
            <span
              onClick={() => setShowLecturerCode(!showLecturerCode)}
              className="absolute right-3 top-3 text-gray-400 cursor-pointer"
            >
              {showLecturerCode ? <EyeOff size={20} /> : <Eye size={20} />}
            </span>
          </div>
        )}

        <button
          onClick={handleSignup}
          disabled={loading}
          className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Sign Up"}
        </button>

        <p className="text-center text-[#8b92a5] mt-4 text-sm">
          Already have an account?{" "}
          <span
            onClick={onSwitch}
            className="text-blue-600 cursor-pointer hover:underline"
          >
            Log in
          </span>
        </p>
      </div>
    </div>
  );
}

export default Signup;
