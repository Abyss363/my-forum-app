import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from './firebase'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ThreadPage from './pages/ThreadPage'

function App() {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [showSignup, setShowSignup] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        const docRef = doc(db, 'users', currentUser.uid)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          setUserProfile(docSnap.data())
        }
      } else {
        setUser(null)
        setUserProfile(null)
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <p className="text-blue-600 text-xl font-bold">Loading...</p>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            user && userProfile
              ? <Home userProfile={userProfile} user={user} />
              : <div>
                {showSignup
                  ? <Signup onSwitch={() => setShowSignup(false)} />
                  : <Login onSwitch={() => setShowSignup(true)} />
                }
              </div>
          }
        />

        <Route
          path="/thread/:threadId"
          element={
            user && userProfile
              ? <ThreadPage userProfile={userProfile} user={user} />
              : <Navigate to="/" />
          }
        />

        <Route path="*" element={<Navigate to="/" />} />

      </Routes>
    </BrowserRouter>
  )

}

export default App