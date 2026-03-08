import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'
import { Eye, EyeOff } from 'lucide-react'

function Login({ onSwitch }) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    async function handleLogin() {
        try {
            await signInWithEmailAndPassword(auth, email, password)
            alert('Logged in successfully!')
        } catch (err) {
            setError(err.message)
        }
    }

    return (
        <div className="min-h-screen bg-blue-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-md">
                <h1 className="text-3xl font-bold text-blue-700 mb-6 text-center">
                    Welcome Back
                </h1>

                {error && (
                    <p className="text-red-500 text-sm mb-4">{error}</p>
                )}

                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 mb-4 outline-none focus:border-blue-500"
                />

                <div className="relative mb-6">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-blue-500"
                    />
                    <span
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-gray-400 cursor-pointer"
                    >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </span>
                </div>

                <button
                    onClick={handleLogin}
                    className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700"
                >
                    Log In
                </button>

                <p className="text-center text-gray-500 mt-4 text-sm">
                    Don't have an account?{' '}
                    <span
                        onClick={onSwitch}
                        className="text-blue-600 cursor-pointer hover:underline"
                    >
                        Sign Up
                    </span>
                </p>
            </div>
        </div>
    )

}

export default Login